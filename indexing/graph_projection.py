"""Bounded relation maintenance with source-level atomic publication.

Known path/name changes dirty their positive and negative dependents. Completed
independent sources keep their evidence and epoch. Unknown namespace changes
start a resumable epoch rebuild; requests never resolve links or parse notes.
"""
import hashlib
import json
import os
import posixpath
import time
from urllib.parse import urlsplit

from django.conf import settings
from django.db import transaction
from django.db.models import Count, F, Q
from wiki.contracts import StorageError
from wiki.links import _decoded, _entry_kind, resolve_relation
from wiki.policy import policy_version, validate_path
from wiki.storage import open_directory, require_ready
from .models import (IndexGeneration, IndexedNote, IndexJob, LinkEdge, RelationDependency, RelationPath,
                     RelationState, ResolvedRelation, ScanState)

RESOLVER_VERSION = 'graph-4'


def namespace_version():
    require_ready()
    with open_directory('') as directory:
        info = os.fstat(directory)
    return hashlib.sha256(json.dumps([RESOLVER_VERSION, policy_version(), str(settings.BACKSTORY_WIKI_ROOT),
                                     info.st_dev, info.st_ino]).encode()).hexdigest()


def path_fingerprint(path):
    """Resolution depends on kind/existence, not attachment contents or mtime."""
    try:
        validate_path(path, 'content')
        return _entry_kind(path)
    except StorageError as error:
        if error.reason_code in {'not_found', 'path_denied'}:
            return 'missing' if error.reason_code == 'not_found' else 'denied'
        raise


def verify_path_batch(generation, after, limit=20, *, checked_count=None):
    """Recheck recorded exact inputs only; never scan asset directories."""
    limit = max(1, min(1024, limit))
    namespace = namespace_version()
    paths = list(RelationPath.objects.filter(generation=generation, pk__gt=after).order_by('pk')[:limit])
    started = time.monotonic()
    observed = {}
    checked = []
    for item in paths:
        observed[item.path] = path_fingerprint(item.path)
        checked.append(item)
        if time.monotonic() - started >= .1:
            break
    complete = len(paths) < limit and len(checked) == len(paths)
    paths = checked
    if namespace_version() != namespace:
        raise StorageError('index_namespace_changed', 503)
    with transaction.atomic():
        ScanState.objects.filter(pk=1).update(errors=F('errors'))
        keys = {'path:' + item.path for item in paths}
        active = set(RelationDependency.objects.filter(note__generation=generation, key__in=keys)
                     .values_list('key', flat=True))
        changed = set()
        refreshed = []
        inactive = []
        for item in paths:
            key = 'path:' + item.path
            if key not in active:
                inactive.append(item.pk)
                continue
            if item.namespace == namespace and item.fingerprint != observed[item.path]:
                changed.add(key)
            if item.fingerprint != observed[item.path] or item.namespace != namespace:
                item.fingerprint, item.namespace = observed[item.path], namespace
                refreshed.append(item)
        if refreshed:
            RelationPath.objects.bulk_update(refreshed, ["fingerprint", "namespace"])
        if inactive:
            RelationPath.objects.filter(pk__in=inactive).delete()
        if changed:
            dirty_dependents(generation, changed)
            record_mutation(generation)
    if checked_count is not None:
        checked_count.append(len(paths))
    return (paths[-1].pk if paths else after), complete


def dependency_keys(source, edge):
    """Index all consulted namespace inputs, even absent higher-priority paths.

    This only describes resolver inputs; resolve_relation remains the sole
    authority for canonical outputs and eligibility. A version change rebuilds
    these disposable keys along with the projection.
    """
    target = edge.target
    if not isinstance(target, str) or len(target) > 4096 or '\\' in target:
        return set()
    if any(ord(char) < 32 or ord(char) == 127 for char in target):
        return set()
    try:
        if edge.kind == 'wiki':
            path = target.partition('|')[0].partition('#')[0]
        elif edge.kind == 'markdown':
            parsed = urlsplit(target)
            if parsed.scheme or parsed.netloc or parsed.query:
                return set()
            path = _decoded(parsed.path)
        else:
            return set()
    except (ValueError, UnicodeError):
        return set()
    if not path:
        return set()
    rooted = edge.kind == 'wiki' and path.startswith('/') and not path.startswith('//')
    if path.startswith('/') and not rooted:
        return set()
    if rooted:
        path = path[1:]
    relative = posixpath.normpath(posixpath.join(posixpath.dirname(source), path))
    root = posixpath.normpath(path)
    root_candidate = edge.kind == 'wiki' and root != '..' and not root.startswith('../')
    bases = [root] if rooted else [root, relative] if root_candidate else [relative]
    keys = {'name:' + path.casefold()} if edge.kind == 'wiki' and not rooted else set()
    for base in bases:
        keys.add('path:' + base)
        if edge.kind == 'wiki' and not base.lower().endswith('.md'):
            keys.add('path:' + base + '.md')
    return keys


def namespace_keys(note):
    from .names import note_names
    return {'path:' + note.path} | {'name:' + name for name, resolvable in
                                     note_names(note.path, note.title, note.ids, note.aliases) if resolvable}


def replace_dependencies(note, edges):
    RelationDependency.objects.filter(note=note).delete()
    keys = set().union(*(dependency_keys(note.path, edge) for edge in edges)) if edges else set()
    RelationDependency.objects.bulk_create([RelationDependency(note=note, key=key) for key in sorted(keys)],
                                           ignore_conflicts=True)
    IndexedNote.objects.filter(pk=note.pk).update(relation_dependencies_complete=True)


def dirty_dependents(generation, keys):
    # Chunk metadata inputs rather than relying on SQLite's variable limit.
    keys = sorted(keys)
    for start in range(0, len(keys), 200):
        sources = RelationDependency.objects.filter(note__generation=generation, key__in=keys[start:start + 200]).values('note_id')
        IndexedNote.objects.filter(pk__in=sources).update(relations_dirty=True, relation_after=0, relation_build_version=0,
                                                        relation_version=F('relation_version') + 1)
    # During a resolver-version/legacy fallback, unbuilt dependency keys cannot
    # establish independence from a namespace edit. Only that uncertain subset
    # restarts; ordinary body/provenance edits never invalidate it.
    IndexedNote.objects.filter(generation=generation, relation_dependencies_complete=False).update(
        relations_dirty=True, relation_after=0, relation_build_version=0, relation_version=F('relation_version') + 1)


def _evidence_complete(generation):
    return not IndexedNote.objects.filter(generation=generation).filter(
        Q(relations_complete=False) | Q(relation_evidence_complete=False)).exists()


def relation_status():
    """Source-free observations; reading status never schedules or repairs work.

    Source-index readiness is deliberately independent of relation publication.
    Counts describe indexed sources, not authoritative filesystem membership.
    """
    from .worker import index_status
    index = index_status()
    generation = IndexGeneration.objects.filter(pk=index.generation).first()
    relation = RelationState.objects.filter(generation=generation).first() if generation else None
    counts = IndexedNote.objects.filter(generation=generation).aggregate(
        total_sources=Count('pk'), pending_sources=Count('pk', filter=Q(relations_dirty=True)),
        parsing_incomplete_sources=Count('pk', filter=Q(relations_complete=False)),
        resolution_incomplete_sources=Count('pk', filter=Q(relations_dirty=False,
                                                          relation_evidence_complete=False)))
    counts['published_sources'] = counts['total_sources'] - counts['pending_sources']
    current = bool(generation and relation and relation.mutation == generation.mutation)
    namespace_current = bool(index.state != 'unavailable' and relation
                             and relation.namespace == namespace_version())
    complete = bool(index.state == 'ready' and current and namespace_current
                    and relation.complete and relation.evidence_complete)
    state, reason, action, automatic = 'ready', '', 'none', False
    if index.state == 'unavailable':
        state, reason, action = 'unavailable', 'relation_storage_unavailable', 'restore_storage'
    elif index.state != 'ready':
        state, reason, action, automatic = 'updating', 'relation_index_updating', 'wait_for_worker', True
    elif not relation or not current:
        state, reason, action, automatic = 'updating', 'relation_projection_pending', 'wait_for_worker', True
    elif not namespace_current:
        state, reason, action, automatic = 'updating', 'relation_namespace_changed', 'wait_for_worker', True
    elif not relation.complete or counts['pending_sources']:
        state, reason, action, automatic = 'updating', 'relation_projection_pending', 'wait_for_worker', True
    elif not complete:
        state = 'incomplete'
        if counts['parsing_incomplete_sources']:
            reason, action = 'relation_parse_incomplete', 'repair_source_and_reindex'
        elif counts['resolution_incomplete_sources']:
            reason, action = 'relation_resolution_incomplete', 'inspect_links_and_reindex'
        else:
            reason, action, automatic = 'relation_projection_pending', 'wait_for_worker', True
            state = 'updating'
    return dict(state=state, reason_code=reason, projection_complete=complete,
                generation=index.generation, mutation=generation.mutation if generation else None,
                relation_epoch=relation.epoch if relation else None,
                publication=relation.publication if relation else 0,
                scope='indexed_saved_content_not_disk_snapshot', **counts,
                retry={'action': action, 'automatic': automatic})


def record_mutation(generation):
    """Called under the source writer lock, after dependency invalidation.

    Advance a known projection's token with the index. A preexisting mismatch
    remains mismatched, forcing a conservative rebuild rather than certifying
    unexplained changes.
    """
    before = IndexGeneration.objects.get(pk=generation.pk).mutation
    IndexGeneration.objects.filter(pk=generation.pk).update(mutation=F('mutation') + 1)
    RelationState.objects.filter(generation=generation, mutation=before).update(
        mutation=before + 1,
        complete=not IndexedNote.objects.filter(generation=generation, relations_dirty=True).exists(),
        evidence_complete=_evidence_complete(generation))


def run_relation_batch(limit=20):
    """None means no work; otherwise return whether relation work remains.

    Stage at most twenty occurrences and publish each source only after all its
    occurrences have resolved against one source/dependency version and policy
    namespace. Unrelated content edits cannot starve a large source.
    """
    from .worker import index_status
    status = index_status()
    if status.state != 'ready' or status.generation is None:
        return None
    generation = IndexGeneration.objects.get(pk=status.generation)
    namespace = namespace_version()
    budget = max(1, min(20, limit))
    with transaction.atomic():
        ScanState.objects.filter(pk=1).update(errors=F('errors'))
        generation.refresh_from_db()
        if generation.state != 'active':
            return True
        state, _ = RelationState.objects.get_or_create(generation=generation)
        dirty = IndexedNote.objects.filter(generation=generation, relations_dirty=True)
        if (state.mutation != generation.mutation or state.namespace != namespace
                or not state.complete and not dirty.exists()):
            state.mutation = generation.mutation
            state.namespace = namespace
            state.epoch += 1
            state.after = 0
            state.complete = False
            state.evidence_complete = False
            state.save()
            IndexedNote.objects.filter(generation=generation).update(
                relations_dirty=True, relation_after=0, relation_build_version=0,
                relation_version=F('relation_version') + 1, relation_dependencies_complete=False)
        elif state.complete:
            # Older aggregate evidence can outlive a removed failing source.
            # Repair only from current per-source evidence under the writer lock.
            if not state.evidence_complete and _evidence_complete(generation):
                state.evidence_complete = True
                state.save(update_fields=['evidence_complete'])
            return None
    source_budget = budget  # Empty sources also consume bounded worker work.
    while budget and source_budget:
        note = (IndexedNote.objects.filter(generation=generation, relations_dirty=True)
                .defer('body', 'projection', 'ids', 'aliases', 'tags').order_by('pk').first())
        if note is None:
            break
        restarting = note.relation_build_version != note.relation_version
        after = 0 if restarting else note.relation_after
        evidence_complete = note.relations_complete if restarting else note.relation_evidence_complete
        edges = list(LinkEdge.objects.filter(note=note, pk__gt=after).order_by('pk')[:budget + 1])
        source_complete = len(edges) <= budget
        edges = edges[:budget]
        rows = []
        keys = set()
        path_observations = {}
        for edge in edges:
            target = edge.target + ('#' + edge.fragment if edge.fragment else '')
            edge_keys = dependency_keys(note.path, edge)
            keys.update(edge_keys)
            for key in edge_keys:
                if key.startswith('path:') and key[5:] not in path_observations:
                    path_observations[key[5:]] = path_fingerprint(key[5:])
            result = resolve_relation(note.path, target, edge.kind)
            if result.state in {'unavailable', 'unconfirmed'}:
                evidence_complete = False
            rows.append(ResolvedRelation(occurrence=edge, generation=generation, epoch=state.epoch,
                                         source=note.path, destination=result.canonical_path or '',
                                         state=result.state, resource_type=result.resource_type,
                                         choices=list(result.choices[:100])))
        require_ready()
        current_namespace = namespace_version()
        if any(path_fingerprint(path) != fingerprint for path, fingerprint in path_observations.items()):
            return True
        with transaction.atomic():
            ScanState.objects.filter(pk=1).update(errors=F('errors'))
            if (current_namespace != namespace
                    or not IndexGeneration.objects.filter(pk=generation.pk, state='active',
                                                          mutation=F('relationstate__mutation')).exists()
                    or IndexJob.objects.exists()
                    or ScanState.objects.filter(pk=1, reconcile_needed=True).exists()
                    or ScanState.objects.filter(pk=1).exclude(checkpoint={}).exists()
                    or ScanState.objects.filter(pk=1).exclude(requested='').exists()
                    or not RelationState.objects.filter(pk=state.pk, epoch=state.epoch, namespace=namespace).exists()
                    or not IndexedNote.objects.filter(pk=note.pk, revision=note.revision, relations_dirty=True,
                                                       relation_version=note.relation_version, relation_after=note.relation_after,
                                                       relation_build_version=note.relation_build_version).exists()):
                return True
            if restarting and not note.relation_dependencies_complete:
                RelationDependency.objects.filter(note=note).delete()
            RelationDependency.objects.bulk_create([RelationDependency(note=note, key=key) for key in sorted(keys)],
                                                   ignore_conflicts=True)
            RelationPath.objects.bulk_create([RelationPath(generation=generation, path=path, fingerprint=fingerprint,
                                                          namespace=namespace)
                                              for path, fingerprint in path_observations.items()], ignore_conflicts=True)
            # A policy/storage epoch cannot reuse an old fingerprint as proof.
            for item in RelationPath.objects.filter(generation=generation, path__in=path_observations).exclude(namespace=namespace):
                item.fingerprint, item.namespace = path_observations[item.path], namespace
                item.save(update_fields=['fingerprint', 'namespace'])
            ResolvedRelation.objects.bulk_create(rows, update_conflicts=True, unique_fields=['occurrence'],
                                                update_fields=['epoch', 'source', 'destination', 'state', 'resource_type', 'choices'])
            note.relation_after = edges[-1].pk if edges else after
            note.relation_build_version = note.relation_version
            note.relation_evidence_complete = evidence_complete
            note.relations_dirty = not source_complete
            note.relation_dependencies_complete = note.relation_dependencies_complete or source_complete
            note.save(update_fields=['relation_after', 'relation_build_version', 'relation_evidence_complete',
                                     'relations_dirty', 'relation_dependencies_complete'])
            state.after = note.relation_after
            if source_complete:
                state.publication += 1
            state.complete = not IndexedNote.objects.filter(generation=generation, relations_dirty=True).exists()
            state.evidence_complete = _evidence_complete(generation)
            state.save(update_fields=['after', 'complete', 'evidence_complete', 'publication'])
        budget -= max(1, len(edges))
        source_budget -= 1
        if state.complete:
            return False
    # An empty generation has no source to publish.
    if not IndexedNote.objects.filter(generation=generation, relations_dirty=True).exists():
        with transaction.atomic():
            ScanState.objects.filter(pk=1).update(errors=F('errors'))
            if IndexGeneration.objects.filter(pk=generation.pk, state='active', mutation=generation.mutation).exists():
                RelationState.objects.filter(pk=state.pk, epoch=state.epoch, namespace=namespace,
                                             mutation=generation.mutation).update(complete=True, evidence_complete=True)
                return False
    return True
