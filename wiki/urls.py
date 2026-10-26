from django.urls import path
from . import views
from indexing import views as index_views

app_name = "wiki"
urlpatterns = [
    path("navigation/", views.navigation, name="navigation"),
    path("revisions/<int:revision_id>/", views.revision, name="revision"),
    path("drafts/<int:draft_id>/", views.draft, name="draft"),
    path("drafts/<int:draft_id>/download/", views.draft, {"download": True}, name="draft-download"),
    path("drafts/", views.drafts, name="drafts"),
    path("history/<path:path>", views.history, name="history"),
    path("restore/<int:revision_id>/", views.restore, name="restore"),
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
