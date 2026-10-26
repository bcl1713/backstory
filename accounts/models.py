from django.conf import settings
from django.db import models


class SessionDevice(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    session_key_digest = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField()
    last_seen_at = models.DateTimeField()
    absolute_expires_at = models.DateTimeField(db_index=True)
    remembered = models.BooleanField(default=False)
    revoked_at = models.DateTimeField(null=True)
