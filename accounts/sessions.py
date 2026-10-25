from datetime import timedelta
import hashlib
from django.conf import settings
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.dispatch import receiver
from django.utils.timezone import now
from .models import SessionDevice


def digest(key):
    return hashlib.sha256(key.encode()).hexdigest()


def idle(remembered):
    return timedelta(seconds=settings.BACKSTORY_REMEMBERED_IDLE_SECONDS if remembered else settings.BACKSTORY_SESSION_IDLE_SECONDS)


@receiver(user_logged_in)
def register_device(sender, request, user, **kwargs):
    timestamp = now()
    remembered = request.POST.get('remember') == 'on'
    absolute = timedelta(seconds=settings.BACKSTORY_REMEMBERED_ABSOLUTE_SECONDS if remembered else settings.BACKSTORY_SESSION_ABSOLUTE_SECONDS)
    SessionDevice.objects.create(user=user, session_key_digest=digest(request.session.session_key), created_at=timestamp,
        last_seen_at=timestamp, absolute_expires_at=timestamp + absolute, remembered=remembered)
    request.session.set_expiry(int(min(idle(remembered), absolute).total_seconds()))


@receiver(user_logged_out)
def invalidate_device(sender, request, user, **kwargs):
    if request and request.session.session_key:
        SessionDevice.objects.filter(session_key_digest=digest(request.session.session_key), revoked_at=None).update(revoked_at=now())


def revoke_sessions(user, device_id=None):
    rows = SessionDevice.objects.filter(user=user, revoked_at=None, absolute_expires_at__gt=now())
    if device_id is not None:
        rows = rows.filter(pk=device_id)
    return rows.update(revoked_at=now())
