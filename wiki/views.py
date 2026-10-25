from dataclasses import asdict
import json
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.exceptions import RequestDataTooBig
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.http import require_GET, require_http_methods

from .attachments import serve_attachment
from .contracts import StorageError
from .formatting import format_source
from .markdown import render_preview
from .policy import authorize_content
from .readiness import check_readiness
from .storage import list_folder, read_note, require_ready


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
                 "url": ("/?" + urlencode({"folder": item.path}) if item.kind == "folder" else reverse("wiki:note" if item.path.lower().endswith(".md") else "wiki:attachment", args=[item.path]))}
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
        response = render(request, "wiki/note.html", {"note": snapshot, "preview": render_preview(snapshot.source, path)})
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
@require_http_methods(["GET", "POST"])
def preview(request, path):
    try:
        authorize_content(request, path)
        require_ready()
        if request.method == "GET":
            snapshot = read_note(path)
            return render(request, "wiki/preview.html", {"note": snapshot, "preview": render_preview(snapshot.source, path)})
        if request.content_type != "application/json":
            raise StorageError("invalid_preview_request")
        try:
            body = json.loads(request.body)
            source = body.get("source") if isinstance(body, dict) else None
            if not isinstance(source, str):
                raise ValueError
            source_bytes = source.encode("utf-8", errors="strict")
        except RequestDataTooBig:
            raise StorageError("note_too_large", 413) from None
        except (ValueError, UnicodeError):
            raise StorageError("invalid_preview_request") from None
        if len(source_bytes) > settings.BACKSTORY_NOTE_MAX_BYTES:
            raise StorageError("note_too_large", 413)
        return JsonResponse(asdict(render_preview(source, path)))
    except StorageError as error:
        return JsonResponse({"reason_code": error.reason_code}, status=error.status)


@login_required
@require_http_methods(["POST"])
def format_note(request, path):
    try:
        authorize_content(request, path)
        require_ready()
        if request.content_type != "application/json":
            raise StorageError("invalid_format_request")
        try:
            body = json.loads(request.body)
            source = body.get("source") if isinstance(body, dict) else None
            if not isinstance(source, str):
                raise ValueError
            source_bytes = source.encode("utf-8", errors="strict")
        except RequestDataTooBig:
            raise StorageError("note_too_large", 413) from None
        except (ValueError, UnicodeError):
            raise StorageError("invalid_format_request") from None
        if len(source_bytes) > settings.BACKSTORY_NOTE_MAX_BYTES:
            raise StorageError("note_too_large", 413)
        return JsonResponse(asdict(format_source(path, source, None)))
    except StorageError as error:
        return JsonResponse({"reason_code": error.reason_code}, status=error.status)


@login_required
@require_http_methods(["GET", "HEAD"])
def attachment(request, path):
    try:
        authorize_content(request, path)
        return serve_attachment(request, path)
    except StorageError as error:
        response = diagnostic(request, error)
        if getattr(error, "content_range", None):
            response["Content-Range"] = error.content_range
        return response


@login_required
@require_GET
def status(request):
    return render(request, "wiki/status.html", {"readiness": check_readiness()})
