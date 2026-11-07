"""Rebuildable projections; authentication/session state never joins rebuilds."""
from django.db import models


class IndexGeneration(models.Model):
    state = models.CharField(max_length=16, default='building', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    mutation = models.PositiveBigIntegerField(default=0)


class IndexedNote(models.Model):
    generation = models.ForeignKey(IndexGeneration, on_delete=models.CASCADE)
    path = models.TextField()
    revision = models.CharField(max_length=66)
    stat = models.JSONField(default=dict)
    title = models.TextField()
    ids = models.JSONField(default=list)
    aliases = models.JSONField(default=list)
    tags = models.JSONField(default=list)
    projection = models.JSONField(default=dict)
    relations_complete = models.BooleanField(default=False)
    relations_dirty = models.BooleanField(default=True)
    relation_after = models.PositiveBigIntegerField(default=0)
    relation_build_version = models.PositiveBigIntegerField(default=0)
    relation_version = models.PositiveBigIntegerField(default=1)
    relation_dependencies_complete = models.BooleanField(default=False)
    relation_evidence_complete = models.BooleanField(default=True)
    seen = models.CharField(max_length=64, default='')
    body = models.TextField()

    class Meta:
        constraints = [models.UniqueConstraint(fields=['generation', 'path'], name='index_generation_path')]
        indexes = [models.Index(fields=['generation', 'path']),
                   models.Index(fields=['generation', 'relations_complete'], name='relation_parse_state'),
                   models.Index(fields=['generation', 'relations_dirty', 'id'], name='relation_dirty_sources')]


class RelationDependency(models.Model):
    """Positive and negative resolver inputs, including higher-priority paths."""
    note = models.ForeignKey(IndexedNote, on_delete=models.CASCADE)
    key = models.TextField(db_index=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['note', 'key'], name='unique_relation_dependency')]


class RelationPath(models.Model):
    """Recorded exact-path inputs, including non-note files and absence."""
    generation = models.ForeignKey(IndexGeneration, on_delete=models.CASCADE)
    path = models.TextField()
    fingerprint = models.CharField(max_length=16)
    namespace = models.CharField(max_length=64)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['generation', 'path'], name='unique_relation_path')]


class LinkEdge(models.Model):
    note = models.ForeignKey(IndexedNote, on_delete=models.CASCADE)
    target = models.TextField()
    kind = models.CharField(max_length=16)
    fragment = models.TextField(default='')
    position = models.JSONField(default=list)
    occurrence_kind = models.CharField(max_length=16, default='link')
    position_precision = models.CharField(max_length=16, default='advisory')


class RelationState(models.Model):
    generation = models.OneToOneField(IndexGeneration, on_delete=models.CASCADE)
    mutation = models.PositiveBigIntegerField(default=0)
    epoch = models.PositiveBigIntegerField(default=0)
    publication = models.PositiveBigIntegerField(default=0)
    namespace = models.CharField(max_length=64, default='')
    after = models.PositiveBigIntegerField(default=0)
    complete = models.BooleanField(default=False)
    evidence_complete = models.BooleanField(default=False)


class ResolvedRelation(models.Model):
    occurrence = models.OneToOneField(LinkEdge, on_delete=models.CASCADE)
    generation = models.ForeignKey(IndexGeneration, on_delete=models.CASCADE)
    epoch = models.PositiveBigIntegerField()
    source = models.TextField(default='')
    destination = models.TextField(default='')
    state = models.CharField(max_length=16)
    resource_type = models.CharField(max_length=16, default='unknown')
    choices = models.JSONField(default=list)

    class Meta:
        indexes = [models.Index(fields=['generation', 'epoch', 'destination', 'source'], name='relation_inverse'),
                   models.Index(fields=['generation', 'epoch', 'state'], name='relation_issues'),
                   models.Index(fields=['generation', 'epoch', 'source', 'destination'], name='relation_forward'),
                   models.Index(fields=['generation', 'epoch', 'source', 'occurrence'], name='relation_source_page'),
                   models.Index(fields=['generation', 'epoch', 'destination', 'occurrence'], name='relation_target_page'),
                   models.Index(fields=['generation', 'epoch', 'occurrence'], name='relation_page')]


class IndexJob(models.Model):
    path = models.TextField(unique=True)
    revision = models.CharField(max_length=66)
    updated = models.DateTimeField(auto_now=True)


class ScanState(models.Model):
    # One durable scheduler/checkpoint. Worker file lease prevents overlap.
    checkpoint = models.JSONField(default=dict)
    requested = models.CharField(max_length=16, default='')
    initialized = models.BooleanField(default=False)
    reconcile_needed = models.BooleanField(default=False)
    processed = models.PositiveIntegerField(default=0)
    discovered = models.PositiveIntegerField(default=0)
    errors = models.PositiveIntegerField(default=0)
    last_error = models.CharField(max_length=64, default='')
    last_completed = models.FloatField(default=0)
    next_incremental = models.FloatField(default=0)
    next_verify = models.FloatField(default=0)
    backoff_until = models.FloatField(default=0)


class IndexedName(models.Model):
    note = models.ForeignKey(IndexedNote, on_delete=models.CASCADE)
    name = models.TextField(db_index=True)
    resolvable = models.BooleanField(default=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['note', 'name'], name='unique_note_name')]
