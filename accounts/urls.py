from django.urls import path
from .views import SignInView, SignOutView, devices

urlpatterns = [
    path("devices/", devices, name="devices"),
    path("login/", SignInView.as_view(), name="login"),
    path("logout/", SignOutView.as_view(), name="logout"),
]
