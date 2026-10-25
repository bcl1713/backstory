"""Rebuildable projections; authentication/session state never joins rebuilds."""
from django.db import models


class IndexGeneration(models.Model):
    state = models.CharField(max_length=16, default='building', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)


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
    seen = models.CharField(max_length=64, default='')
    body = models.TextField()

    class Meta:
        constraints = [models.UniqueConstraint(fields=['generation', 'path'], name='index_generation_path')]
        indexes = [models.Index(fields=['generation', 'path'])]


class LinkEdge(models.Model):
    note = models.ForeignKey(IndexedNote, on_delete=models.CASCADE)
    target = models.TextField()
    kind = models.CharField(max_length=16)
    fragment = models.TextField(default='')
    position = models.JSONField(default=list)


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
