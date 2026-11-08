"""Bounded, eligible indexed-source diagnostics; no note-body reads or repairs."""
from dataclasses import asdict, dataclass

from django.db.models import Q
from django.urls import reverse

from wiki.policy import validate_path
from .graph import CANDIDATE_LIMIT, Query, _bounded, _limit, _string
from .graph_contracts import PageMetadata
from .models import IndexedNote

SAFE_CODES = frozenset({
    'metadata_size_limit', 'metadata_structure_limit', 'metadata_cycle',
    'metadata_unsupported_tag', 'metadata_unsupported_node', 'metadata_unsupported_key',
    'metadata_duplicate_key', 'metadata_parse_error', 'metadata_unclosed',
    'projection_parse_failed',
})


@dataclass(frozen=True, kw_only=True)
class DiagnosticPage(PageMetadata):
    items: tuple = ()


@_bounded
def query_diagnostics(*, scope, folder='', cursor=None, limit=30):
    validate_path(folder, 'folder')
    _string(scope, 4096, 'invalid_arguments', empty=False)
    _limit(limit, 100)
    context = Query({'kind': 'index_diagnostics', 'scope': scope, 'folder': folder, 'limit': limit}, cursor)
    rows = IndexedNote.objects.filter(generation=context.generation, pk__gt=context.after).filter(
        Q(relations_complete=False) | Q(relations_dirty=True) | Q(relation_evidence_complete=False))
    if folder:
        rows = rows.filter(path__startswith=folder + '/')
    # Select only the diagnostic JSON key, never metadata, body or full projection.
    rows = list(rows.order_by('pk').values('pk', 'path', 'revision', 'stat', 'relations_complete',
        'relations_dirty', 'relation_evidence_complete', 'projection__diagnostics')[:CANDIDATE_LIMIT + 1])
    items, after = [], context.after
    for row in rows[:CANDIDATE_LIMIT]:
        after = row['pk']
        if context.index.state == 'unavailable':
            break
        if context.check_row({**row, 'short_title': ''}) is None:
            continue
        raw_codes = row['projection__diagnostics']
        codes = sorted({code if isinstance(code, str) and code in SAFE_CODES else 'index_diagnostic_unknown'
                        for code in raw_codes[:32]}) if isinstance(raw_codes, list) else ['index_diagnostic_unknown']
        if not row['relations_complete'] and not codes:
            codes = ['index_diagnostic_unknown']
        pending = row['relations_dirty']
        if row['relations_complete'] and not pending and not row['relation_evidence_complete']:
            # This can include a parsing limitation on this same source; it is
            # not evidence of a distinct second error or a disclosed link target.
            codes = sorted(set(codes) | {'relation_evidence_incomplete'})
        items.append(dict(path=row['path'], href=reverse('wiki:note', args=[row['path']]),
            source_revision=row['revision'], diagnostic_codes=codes,
            parsing_complete=row['relations_complete'], pending=pending,
            resolution_complete=bool(not pending and row['relation_evidence_complete'])))
        if len(items) == limit:
            break
    more = bool(rows and after < rows[-1]['pk'])
    data = asdict(context.finish(DiagnosticPage, items=tuple(items),
                                next_cursor=context.cursor(after) if more else None))
    data['enumeration_complete'] = bool(not data['next_cursor'] and data['freshness']['state'] == 'ready'
        and not (set(data['limiting_reasons']) - {'projection_incomplete'}))
    return data
