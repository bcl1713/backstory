"""Local access adapter to guarded domain operations. No requests or wiki IO backend."""
from dataclasses import asdict
from urllib.parse import urlencode

from django.core.exceptions import PermissionDenied
from django.db import DatabaseError
from django.urls import reverse

from .actors import require_actor
from .contracts import PathDenied, StorageError
from .storage import read_note, list_folder, require_ready
from . import management_service as management


def invoke(access, name, arguments, *, write=False):
    """One invocation, never replay. Unknown write outcomes remain uncertain."""
    try:
        require_actor(access.actor)
        data = _dispatch(access, name, arguments)
    except PermissionDenied:
        data = {'state': 'error', 'reason_code': 'access_denied'}
    except StorageError as error:
        data = {'state': 'unavailable' if error.status == 503 else 'error',
                'reason_code': error.reason_code,
                'restart': error.reason_code in {'cursor_invalid', 'search_cursor_expired', 'graph_cursor_expired'}}
        if hasattr(error, 'diagnostic') and name not in {'edit_note', 'preview_edit_note'}:
            data['identity_diagnostic'] = error.diagnostic
    except Exception:
        # A failure after publication is not evidence of a failed mutation.
        # Do not expose exceptions, note text, credentials or automatic recovery.
        data = {'state': 'uncertain' if write else 'unavailable',
                'reason_code': 'operation_outcome_unknown' if write else 'component_unavailable',
                'authoritative': False}
        if write:
            data.update(inspect_before_retry=True, read_before_retry=True)
            if 'operation_id' in arguments:
                data['operation_id'] = arguments['operation_id']
    return {'untrusted_content': True, **data}


def _dispatch(access, name, args):
    if name == 'wiki_status':
        from .tool_status import status_snapshot
        data = status_snapshot()
        data['capabilities']['save_serialization_scope'] = 'process'
        data['native_mcp'] = {'contract_version': 1, 'transport': 'stdio',
                              'access': 'configured_local_process', 'browser_drafts_visible': False}
        return data
    if name == 'read_note':
        path = access.authorize(args['path'])
        if not path.lower().endswith('.md'):
            raise PathDenied()
        note = read_note(path)
        return {'state': 'ok', 'path': note.path, 'href': reverse('wiki:note', args=[note.path]),
                'source': note.source, 'revision': note.revision, 'bom': note.bom,
                'newline': note.newline, 'authoritative': True}
    if name == 'read_notes':
        from .tool_reads import read_many
        return read_many(args['paths'], authorize=access.authorize)
    if name == 'list_notes':
        folder = access.authorize(args.get('folder', ''), 'folder')
        page = list_folder(folder, args.get('cursor'), args.get('limit', 100))
        entries = []
        for entry in page.entries:
            if entry.kind == 'folder':
                href = reverse('wiki:shell') + '?' + urlencode({'folder': entry.path})
            elif entry.path.lower().endswith('.md'):
                href = reverse('wiki:note', args=[entry.path])
            else:
                continue
            entries.append({**asdict(entry), 'href': href})
        return {'state': 'ok', 'path': page.path, 'entries': entries,
                'next_cursor': page.next_cursor, 'authoritative': True}
    if name == 'search_notes':
        from indexing.search import search_notes
        access.authorize('', 'folder')
        require_ready()
        page = search_notes(args['query'], args.get('cursor'), args.get('limit', 30))
        freshness = asdict(page.freshness)
        state = ('unavailable' if freshness['state'] == 'unavailable' else 'matches' if page.items else
                 'no_matches' if freshness['state'] == 'ready' and not freshness['limited'] and not page.next_cursor else 'incomplete')
        return {'state': state, 'items': [asdict(item) for item in page.items],
                'next_cursor': page.next_cursor, 'freshness': freshness, 'authoritative': False}
    if name == 'create_folder':
        from .folders import create_folder
        return create_folder(access.authorize(args['path'], 'folder'), access.actor)
    if name == 'preview_edit_note':
        from .edit_preview import preview_edit_note
        path = access.authorize(args['path'])
        return preview_edit_note(access.actor, path, args['old_text'], args['new_text'], args['revision'])
    if name == 'edit_note':
        from .saves import edit_note
        from .tool_results import edited_result
        path = access.authorize(args['path'])
        return edited_result(edit_note(access.actor, path, args['old_text'], args['new_text'], args['revision']), path)
    if name in {'create_note', 'save_note'}:
        from .saves import parse_precondition, save_note
        from .tool_results import saved_result
        path = access.authorize(args['path'])
        create = name == 'create_note'
        base = None if create else parse_precondition(args['revision'], None)
        return saved_result(save_note(access.actor, path, args['source'], base), path, create=create)[0]
    if name == 'list_operations':
        from .operation_inspection import list_operations
        return list_operations(access, **args)
    if name == 'preview_move':
        from .relocations import preview_move
        source, destination = (access.authorize(args[key]) for key in ('source', 'destination'))
        operation = preview_move(access.actor, source, destination)
        try:
            return management._move_data(access, operation)
        except (StorageError, OSError, DatabaseError):
            return {'state': 'uncertain', 'operation_id': str(operation.pk),
                    'reason_code': 'move_preparation_readback_unconfirmed',
                    'authoritative': False, 'inspect_before_retry': True}
    if name == 'get_move':
        return management._move_data(access, management._operation(access, args['operation_id']))
    if name in {'commit_move', 'rollback_move'}:
        return management.mutate_move(access, args['operation_id'],
                    review_token=args.get('review_token'), rollback=name == 'rollback_move')
    if name == 'list_note_history':
        return management.list_history(access, **args)
    if name == 'read_note_revision':
        row = management.history_record(access, args['revision_id'])
        return {'state': 'ok', 'path': row.path, **management._metadata(row),
                **management._historical_source(row), 'authoritative': False}
    if name == 'restore_note_revision':
        from .revisions import restore_revision
        from .saves import parse_precondition
        from .tool_results import saved_result
        path = access.authorize(args['path'])
        row = management.history_record(access, args['revision_id'])
        if row.path != path:
            raise StorageError('history_revision_changed', 412)
        management._historical_source(row)
        base = parse_precondition(args['revision'], None)
        return saved_result(restore_revision(access.actor, row.pk, base, expected_path=path), path)[0]
    if name in {'preview_removal', 'get_removal', 'commit_removal', 'restore_removal'}:
        from . import removals
        access.authorize('', 'folder')
        if name == 'preview_removal':
            access.authorize(args['path'], 'folder' if args['kind'] == 'folder' else 'content')
        return getattr(removals, name)(access.actor, **args)
    if name in {'get_note_links', 'get_note_graph', 'get_graph_snapshot', 'find_link_issues', 'get_index_diagnostics'}:
        from indexing.graph import query_links, query_graph, query_link_issues
        from indexing.graph_snapshot import query_snapshot
        from indexing.graph_diagnostics import query_diagnostics
        for key in ('path', 'folder'):
            if key in args:
                access.authorize(args[key], 'folder' if key == 'folder' else 'content')
        access.authorize('', 'folder')
        if name in {'get_graph_snapshot', 'get_index_diagnostics'}:
            service = query_snapshot if name == 'get_graph_snapshot' else query_diagnostics
            return service(scope=access.key, **args)
        service = {'get_note_links': query_links, 'get_note_graph': query_graph, 'find_link_issues': query_link_issues}[name]
        return asdict(service(**args))
    if name in {'upload_file', 'inspect_upload'}:
        from .file_service import upload_encoded, inspect
        return (upload_encoded if name == 'upload_file' else inspect)(access, **args)
    raise StorageError('unknown_tool')
