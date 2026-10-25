from django.apps import AppConfig


class BackstoryConfig(AppConfig):
    name = "backstory"

    def ready(self):
        from . import checks  # noqa: F401
