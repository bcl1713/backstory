from django.core.management.base import BaseCommand
from wiki.readiness import check_readiness


class Command(BaseCommand):
    help = "Check storage identity without creating or modifying wiki files."

    def handle(self, *args, **options):
        readiness = check_readiness()
        self.stdout.write(f"{readiness.state}: {readiness.reason_code} ({readiness.checked_at.isoformat()})")
