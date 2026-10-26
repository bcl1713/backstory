"""Interactive-only account creation with hidden password input."""
import getpass
import warnings
from django.contrib.auth import get_user_model, password_validation
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import IntegrityError


class Command(BaseCommand):
    help = "Create a named account interactively; password input is hidden."

    def handle(self, *args, **options):
        try:
            username = input("Username: ").strip()
            user = get_user_model()(username=username)
            user.full_clean(exclude=["password", "last_login", "date_joined"])
            with warnings.catch_warnings():
                warnings.simplefilter("error", getpass.GetPassWarning)
                password = getpass.getpass("Password: ")
                confirmation = getpass.getpass("Password (again): ")
            if password != confirmation:
                raise CommandError("Passwords do not match")
            password_validation.validate_password(password, user)
            user.set_password(password)
            user.save()
        except (EOFError, KeyboardInterrupt, getpass.GetPassWarning):
            raise CommandError("A terminal with hidden password input is required") from None
        except ValidationError as error:
            raise CommandError("; ".join(error.messages)) from None
        except IntegrityError:
            raise CommandError("Account could not be created; choose a unique username") from None
        self.stdout.write(self.style.SUCCESS("Account created."))
