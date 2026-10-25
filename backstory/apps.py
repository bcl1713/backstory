from django.apps import AppConfig


class BackstoryConfig(AppConfig):
    name = "backstory"

    def ready(self):
        from . import checks  # noqa: F401
        from wiki.readiness import check_readiness
        self.storage_readiness = check_readiness()
