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
