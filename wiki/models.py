"""Protected recovery material lives only in the local application database."""
from django.conf import settings
from django.db import models


class SavedRevision(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    path = models.CharField(max_length=4096)
    base_revision = models.CharField(max_length=66, null=True)
    original = models.BinaryField()
    submitted = models.BinaryField()
    created_at = models.DateTimeField(auto_now_add=True)


class FormatRecovery(models.Model):
    token_digest = models.CharField(max_length=64, unique=True)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    path = models.CharField(max_length=4096)
    base_revision = models.CharField(max_length=66, null=True)
    source_digest = models.CharField(max_length=64)
    diagnostics = models.JSONField()
    diff = models.TextField(default="")
    expires_at = models.DateTimeField()


class RecoveryDraft(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    path = models.CharField(max_length=4096)
    base_revision = models.CharField(max_length=66, null=True)
    source = models.BinaryField()
    base_source = models.BinaryField(default=b'')
    bom = models.BooleanField(default=False)
    newline = models.CharField(max_length=2, default='\n')
    diagnostics = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)


class MoveOperation(models.Model):
    """Durable reviewed relocation and roll-forward recovery journal."""
    import uuid
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    source = models.CharField(max_length=4096)
    destination = models.CharField(max_length=4096)
    state = models.CharField(max_length=32, default='preview')
    plan = models.JSONField()
    reason_code = models.CharField(max_length=64, default='')
    index_state = models.CharField(max_length=16, default='not_started')
    created_at = models.DateTimeField(auto_now_add=True)


class WikiSettings(models.Model):
    """One server-authoritative setting row for this installation's wiki."""
    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    timezone = models.CharField(max_length=128)
