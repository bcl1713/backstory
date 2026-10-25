from django.urls import path
from . import views

app_name = "wiki"
urlpatterns = [
    path("", views.shell, name="shell"),
    path("folders/", views.folders, name="folders"),
    path("folders/<path:path>", views.folders, name="folder"),
    path("notes/<path:path>", views.note, name="note"),
    path("source/<path:path>", views.source, name="source"),
    path("preview/<path:path>", views.preview, name="preview"),
    path("format/<path:path>", views.format_note, name="format"),
    path("save/<path:path>", views.save, name="save"),
    path("attachments/<path:path>", views.attachment, name="attachment"),
    path("status/", views.status, name="status"),
]
