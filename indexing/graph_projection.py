"""Resumable canonical occurrence projection, never built by an HTTP request.

Any indexed namespace/source mutation invalidates every relation. Old epochs
are withheld immediately, then overwritten in batches. Publication is a short
compare-and-set against the exact generation mutation and policy/storage token.
This is an index epoch, not an immutable snapshot of the filesystem.
"""
import hashlib
import json
import os

from django.conf import settings
from django.db import transaction
from django.db.models import F
from wiki.links import resolve_relation
from wiki.policy import policy_version
from wiki.storage import open_directory, require_ready
from .models import IndexGeneration, IndexedNote, LinkEdge, RelationState, ResolvedRelation, ScanState

RESOLVER_VERSION = 'graph-2'


def namespace_version():
    require_ready()
    with open_directory('') as directory:
        info = os.fstat(directory)
    return hashlib.sha256(json.dumps([RESOLVER_VERSION, policy_version(), str(settings.BACKSTORY_WIKI_ROOT),
                                     info.st_dev, info.st_ino]).encode()).hexdigest()


def run_relation_batch(limit=20):
    """None means no work; otherwise return whether more relation work remains."""
    from .worker import index_status
    status = index_status()
    if status.state != 'ready' or status.generation is None:
        return None
    generation = IndexGeneration.objects.get(pk=status.generation)
    namespace = namespace_version()
    with transaction.atomic():
        ScanState.objects.filter(pk=1).update(errors=F('errors'))
        state, _ = RelationState.objects.get_or_create(generation=generation)
        if state.mutation != generation.mutation or state.namespace != namespace:
            state.mutation = generation.mutation
            state.namespace = namespace
            state.epoch += 1
            state.after = 0
            state.complete = False
            state.evidence_complete = not IndexedNote.objects.filter(generation=generation, relations_complete=False).exists()
            state.save()
        elif state.complete:
            return None
    # Never load bodies; canonical resolution stats files and bounded names only.
    edges = list(LinkEdge.objects.filter(note__generation=generation, pk__gt=state.after)
                 .select_related('note').defer('note__body', 'note__projection', 'note__ids', 'note__aliases', 'note__tags')
                 .order_by('pk')[:max(1, min(20, limit))])
    rows = []
    for edge in edges:
        target = edge.target + ('#' + edge.fragment if edge.fragment else '')
        result = resolve_relation(edge.note.path, target, edge.kind)
        if result.state in {'unavailable', 'unconfirmed'}:
            state.evidence_complete = False
        rows.append(ResolvedRelation(occurrence=edge, generation=generation, epoch=state.epoch,
                                    source=edge.note.path,
                                    destination=result.canonical_path or '', state=result.state,
                                    resource_type=result.resource_type, choices=list(result.choices[:100])))
    require_ready()
    current_namespace = namespace_version()
    with transaction.atomic():
        ScanState.objects.filter(pk=1).update(errors=F('errors'))
        if (current_namespace != namespace or
                not IndexGeneration.objects.filter(pk=generation.pk, state='active', mutation=state.mutation).exists()):
            return True
        ResolvedRelation.objects.bulk_create(rows, update_conflicts=True, unique_fields=['occurrence'],
                                            update_fields=['epoch', 'source', 'destination', 'state', 'resource_type', 'choices'])
        if edges:
            state.after = edges[-1].pk
        state.complete = len(edges) < max(1, min(20, limit))
        state.save(update_fields=['after', 'complete', 'evidence_complete'])
    return not state.complete
