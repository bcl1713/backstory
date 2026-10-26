from django.urls import include, path
from .views import health

urlpatterns = [path("health/", health, name="health"), path("accounts/", include("accounts.urls")), path("", include("wiki.urls"))]
