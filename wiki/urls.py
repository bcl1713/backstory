from django.urls import path
from . import views
from indexing import views as index_views

app_name = "wiki"
urlpatterns = [
    path("", views.shell, name="shell"),
    path("new/", views.new_note, name="new"),
    path("folders/", views.folders, name="folders"),
    path("folders/<path:path>", views.folders, name="folder"),
    path("notes/<path:path>", views.note, name="note"),
    path("source/<path:path>", views.source, name="source"),
    path("preview/<path:path>", views.preview, name="preview"),
    path("format/<path:path>", views.format_note, name="format"),
    path("save/<path:path>", views.save, name="save"),
    path("attachments/<path:path>", views.attachment, name="attachment"),
    path("search/", index_views.search, name="search"),
    path("resolve/", index_views.resolve, name="resolve"),
    path("index/status/", index_views.status, name="index-status"),
    path("index/schedule/", index_views.schedule, name="index-schedule"),
    path("status/", views.status, name="status"),
]
