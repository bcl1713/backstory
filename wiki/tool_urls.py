from django.urls import path
from . import tool_views, image_uploads, graph_views

urlpatterns = [
    path('links/', graph_views.links, name='tool-links'),
    path('graph/', graph_views.graph, name='tool-graph'),
    path('link-issues/', graph_views.issues, name='tool-link-issues'),
    path('images/', image_uploads.upload_image, name='tool-images'),
    path('read-many/', tool_views.read_many, name='tool-read-many'),
    path('status/', tool_views.status, name='tool-status'),
    path('create-folder/', tool_views.create_folder, name='tool-create-folder'),
    path('complete/', tool_views.complete, name='tool-complete'),
    path('save/', tool_views.save, name='tool-save'),
    path('search/', tool_views.search, name='tool-search'),
    path('read/', tool_views.read, name='tool-read'),
    path('list/', tool_views.list_notes, name='tool-list'),
]
