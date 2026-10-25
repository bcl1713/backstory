from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.urls import include, path


@login_required
def shell(request):
    return render(request, "shell.html")


urlpatterns = [path("accounts/", include("accounts.urls")), path("", shell, name="shell")]
