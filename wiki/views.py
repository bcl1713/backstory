from dataclasses import asdict
from urllib.parse import urlencode

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.http import require_GET

from .contracts import StorageError
from .policy import authorize_content
from .readiness import check_readiness
from .storage import list_folder, read_note


def diagnostic(request, error):
    return render(request, "wiki/status.html", {"diagnostic": error.reason_code}, status=error.status)


@login_required
@require_GET
def shell(request):
    readiness = check_readiness()
    context = {"readiness": readiness}
    if readiness.state == "ready":
        try:
            folder = authorize_content(request, request.GET.get("folder", ""), "folder")
            page = list_folder(folder, request.GET.get("cursor"))
            context["folder"] = folder
            context["entries"] = [
                {"name": item.name, "kind": item.kind,
                 "url": ("/?" + urlencode({"folder": item.path}) if item.kind == "folder" else reverse("wiki:note", args=[item.path]))}
                for item in page.entries
            ]
            if page.next_cursor:
                context["next_url"] = "/?" + urlencode({"folder": folder, "cursor": page.next_cursor})
        except StorageError as error:
            return diagnostic(request, error)
    return render(request, "wiki/shell.html", context)


@login_required
@require_GET
def folders(request, path=""):
    try:
        authorize_content(request, path, "folder")
        try:
            limit = int(request.GET.get("limit", "100"))
        except ValueError:
            raise StorageError("invalid_limit") from None
        page = list_folder(path, request.GET.get("cursor"), limit)
        return JsonResponse(asdict(page))
    except StorageError as error:
        return JsonResponse({"reason_code": error.reason_code, "restart": error.reason_code == "cursor_invalid"}, status=error.status)


@login_required
@require_GET
def note(request, path):
    try:
        authorize_content(request, path)
        snapshot = read_note(path)
        response = render(request, "wiki/note.html", {"note": snapshot})
        response["ETag"] = snapshot.revision
        return response
    except StorageError as error:
        return diagnostic(request, error)


@login_required
@require_GET
def source(request, path):
    try:
        authorize_content(request, path)
        snapshot = read_note(path)
        response = HttpResponse(snapshot.source, content_type="text/plain; charset=utf-8")
        response["ETag"] = snapshot.revision
        return response
    except StorageError as error:
        return diagnostic(request, error)


@login_required
@require_GET
def status(request):
    return render(request, "wiki/status.html", {"readiness": check_readiness()})
