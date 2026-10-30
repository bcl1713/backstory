from django.urls import path
from . import tool_views

urlpatterns = [
    path('create-folder/', tool_views.create_folder, name='tool-create-folder'),
    path('complete/', tool_views.complete, name='tool-complete'),
    path('save/', tool_views.save, name='tool-save'),
    path('search/', tool_views.search, name='tool-search'),
    path('read/', tool_views.read, name='tool-read'),
    path('list/', tool_views.list_notes, name='tool-list'),
]
