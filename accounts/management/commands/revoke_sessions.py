from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from accounts.sessions import revoke_sessions


class Command(BaseCommand):
    help = 'Interactively revoke one/all sessions or disable an account. No password arguments.'
    def handle(self, *args, **options):
        try:
            user = get_user_model().objects.get(username=input('Username: ').strip())
            action = input('Action (all, device, disable): ').strip()
            if action not in {'all', 'device', 'disable'}:
                raise CommandError('Unknown action')
            device = input('Device number: ').strip() if action == 'device' else None
            if device is not None and not device.isdecimal():
                raise CommandError('Invalid device number')
            if action == 'disable':
                user.is_active = False; user.save(update_fields=['is_active'])
            count = revoke_sessions(user, device)
        except get_user_model().DoesNotExist:
            raise CommandError('Unknown account') from None
        except (EOFError, KeyboardInterrupt):
            raise CommandError('Interactive input required') from None
        self.stdout.write(f'Revoked {count} session(s).')
