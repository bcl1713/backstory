"""Protected recovery material lives only in the local application database."""
from django.conf import settings
from django.db import models


class LocalActor(models.Model):
    """One installation-local stdio authority, deliberately unrelated to accounts."""
    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    enabled = models.BooleanField(default=True)
    storage_context = models.JSONField(default=dict, editable=False)


class SavedRevision(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True)
    local_actor = models.ForeignKey(LocalActor, on_delete=models.PROTECT, null=True)
    path = models.CharField(max_length=4096)
    base_revision = models.CharField(max_length=66, null=True)
    original = models.BinaryField()
    submitted = models.BinaryField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.CheckConstraint(
            condition=(models.Q(actor__isnull=False, local_actor__isnull=True) |
                       models.Q(actor__isnull=True, local_actor__isnull=False)),
            name='savedrevision_one_owner')]


class FormatRecovery(models.Model):
    token_digest = models.CharField(max_length=64, unique=True)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True)
    local_actor = models.ForeignKey(LocalActor, on_delete=models.PROTECT, null=True)
    path = models.CharField(max_length=4096)
    base_revision = models.CharField(max_length=66, null=True)
    source_digest = models.CharField(max_length=64)
    diagnostics = models.JSONField()
    diff = models.TextField(default="")
    expires_at = models.DateTimeField()

    class Meta:
        constraints = [models.CheckConstraint(
            condition=(models.Q(actor__isnull=False, local_actor__isnull=True) |
                       models.Q(actor__isnull=True, local_actor__isnull=False)),
            name='formatrecovery_one_owner')]


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
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True)
    local_actor = models.ForeignKey(LocalActor, on_delete=models.PROTECT, null=True)
    source = models.CharField(max_length=4096)
    destination = models.CharField(max_length=4096)
    state = models.CharField(max_length=32, default='preview')
    plan = models.JSONField()
    reason_code = models.CharField(max_length=64, default='')
    index_state = models.CharField(max_length=16, default='not_started')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.CheckConstraint(
            condition=(models.Q(actor__isnull=False, local_actor__isnull=True) |
                       models.Q(actor__isnull=True, local_actor__isnull=False)),
            name='moveoperation_one_owner')]


class WikiSettings(models.Model):
    """One server-authoritative setting row for this installation's wiki."""
    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    timezone = models.CharField(max_length=128)


class RemovalOperation(models.Model):
    """Actor-owned exact-target trash; recovery bytes are never auto-pruned."""
    import uuid
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True)
    local_actor = models.ForeignKey(LocalActor, on_delete=models.PROTECT, null=True)
    path = models.CharField(max_length=4096)
    kind = models.CharField(max_length=8)
    base_revision = models.CharField(max_length=66, null=True)
    original = models.BinaryField(default=b'')
    state = models.CharField(max_length=32, default='preview', db_index=True)
    plan = models.JSONField()
    reason_code = models.CharField(max_length=64, default='')
    index_state = models.CharField(max_length=16, default='not_started')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.CheckConstraint(
            condition=(models.Q(actor__isnull=False, local_actor__isnull=True) |
                       models.Q(actor__isnull=True, local_actor__isnull=False)),
            name='removaloperation_one_owner')]


class MovePreviewJob(models.Model):
    """Short-lived metadata; a full reviewed plan is always a MoveOperation."""
    import uuid
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    source = models.CharField(max_length=4096)
    destination = models.CharField(max_length=4096)
    context = models.JSONField()
    state = models.CharField(max_length=32, default='queued', db_index=True)
    reason_code = models.CharField(max_length=64, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    settled_at = models.DateTimeField(null=True)
