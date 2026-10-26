from django.core.management.base import BaseCommand
from django.contrib.sessions.models import Session
from accounts.models import SessionDevice
from accounts.sessions import now, idle


class Command(BaseCommand):
    help = 'Remove expired server sessions and expired/revoked device records.'
    def handle(self, *args, **options):
        timestamp = now()
        for remembered in (False, True):
            SessionDevice.objects.filter(remembered=remembered, last_seen_at__lte=timestamp-idle(remembered)).delete()
        SessionDevice.objects.filter(absolute_expires_at__lte=timestamp).delete()
        SessionDevice.objects.filter(revoked_at__isnull=False).delete()
        Session.objects.filter(expire_date__lte=timestamp).delete()
