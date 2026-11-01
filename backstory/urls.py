from django.urls import include, path
from .views import health
from .renderers import mermaid_frame

urlpatterns = [path("renderers/mermaid-frame/", mermaid_frame, name="mermaid_frame"), path("health/", health, name="health"), path("accounts/", include("accounts.urls")), path("", include("wiki.urls"))]
