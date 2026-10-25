from django.core.management.base import BaseCommand
from wiki.revisions import prune_recovery
from wiki.staging import cleanup_staged_saves


class Command(BaseCommand):
    help = 'Prune expired protected recovery data and safely clean registered abandoned stages.'
    def handle(self, *args, **options):
        prune_recovery()
        cleanup_staged_saves()
        self.stdout.write('Recovery cleanup complete.')
