"""Authoritative save readback shared by transports; indexing is independent."""
from dataclasses import asdict
from django.urls import reverse
from .contracts import StorageError
from .storage import read_note


def saved_result(result, path, *, create=False, include_index=True):
    data = asdict(result)
    data.pop('recovery_token', None)
    data.pop('status', None)
    data.update(path=path, href=reverse('wiki:note', args=[path]), authoritative=False)
    status = result.status
    if result.state in {'saved', 'saved_index_delayed', 'saved_source', 'saved_source_index_delayed', 'noop'}:
        try:
            note = read_note(path)
            if note.revision != result.revision:
                raise StorageError('saved_readback_changed', 503)
        except StorageError:
            data.update(state='uncertain', reason_code='saved_readback_unconfirmed', read_before_retry=True)
            status = 503
        else:
            data.update(source=note.source, revision=note.revision, bom=note.bom,
                        newline=note.newline, authoritative=True)
            if create:
                data['state'] = 'created_index_delayed' if result.state == 'saved_index_delayed' else 'created'
                status = 201
    elif result.state == 'uncertain':
        data['read_before_retry'] = True
    if include_index:
        from indexing.worker import index_status
        try:
            data['index'] = asdict(index_status())
        except Exception:
            data['index'] = {'state': 'unavailable'}
    return data, status


def edited_result(result, path):
    """Reuse authoritative save readback; project no source/diff/formatter text."""
    data, _ = saved_result(result, path)
    compact = {key: data[key] for key in ('state', 'revision', 'authoritative', 'reason_code') if key in data}
    compact['index'] = {'state': data.get('index', {}).get('state', 'unavailable')}
    compact['indexing'] = {'state': {'saved': 'queued', 'saved_index_delayed': 'delayed',
        'noop': 'unchanged'}.get(result.state, 'not_confirmed' if result.state in {'uncertain', 'current'} else 'not_requested')}
    uncertain = data['state'] in {'uncertain', 'current'} or any(
        item.get('code') == 'durability_uncertain' for item in data.get('diagnostics', []))
    if uncertain:
        compact.update(read_before_retry=True, inspect_before_retry=True)
    if any(item.get('code') == 'durability_uncertain' for item in data.get('diagnostics', [])):
        compact['durability_confirmed'] = False
    return compact
