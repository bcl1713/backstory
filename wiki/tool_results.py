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
