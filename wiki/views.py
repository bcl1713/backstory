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
from .contracts import SaveResult, StorageError
from .formatting import format_source
from .markdown import render_preview
from .policy import authorize_content
from .readiness import check_readiness
from .storage import list_folder, open_directory, read_note, require_ready
from .saves import format_with_recovery, parse_precondition, save_note


def diagnostic(request, error):
    return render(request, "wiki/status.html", {"diagnostic": error.reason_code}, status=error.status)


@login_required
@require_GET
def shell(request):
    readiness = check_readiness()
    context = {"readiness": readiness}
    if readiness.state == "ready":
        try:
            folder = authorize_content(request, request.GET.get("folder", ""), "folder", query_parameter="folder")
            if "folder" not in request.GET and "cursor" not in request.GET:
                # Only absence falls back: denied, invalid and unavailable notes
                # retain the same diagnostics as explicit note navigation.
                authorize_content(request, "index.md")
                try:
                    snapshot = read_note("index.md")
                except StorageError as error:
                    if error.reason_code != "not_found":
                        raise
                else:
                    return note_response(request, snapshot)
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
def new_note(request):
    try:
        folder = authorize_content(request, request.GET.get("folder", ""), "folder", query_parameter="folder")
        require_ready()
        # Validate only the requested existing directory, without listing it.
        with open_directory(folder):
            pass
        return render(request, "wiki/note.html", {
            "is_new": True,
            "folder": folder,
            "note": {"path": "", "source": "", "newline": "\n", "revision": None},
        })
    except StorageError as error:
        return diagnostic(request, error)


def note_response(request, snapshot):
    response = render(request, "wiki/note.html", {"note": snapshot})
    response["ETag"] = snapshot.revision
    return response


@login_required
@require_GET
def note(request, path):
    try:
        authorize_content(request, path)
        snapshot = read_note(path)
        return note_response(request, snapshot)
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
        if "If-Match" in request.headers or "If-None-Match" in request.headers:
            base = parse_precondition(request.headers.get("If-Match"), request.headers.get("If-None-Match"))
            result = format_with_recovery(request.user, path, source, base)
            if isinstance(result, SaveResult):
                return JsonResponse(asdict(result), status=result.status)
            formatted, token = result
            return JsonResponse({**asdict(formatted), "recovery_token": token})
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
    from indexing.worker import index_status
    from .models import MoveOperation
    pending = MoveOperation.objects.filter(state__in=['applying', 'recovery_required'])
    return render(request, "wiki/status.html", {"readiness": check_readiness(), "index": index_status(),
        "moves_pending": pending.filter(actor=request.user), "writes_paused": pending.exists()})


@login_required
@require_http_methods(["POST"])
def save(request, path):
    try:
        authorize_content(request, path)
        base = parse_precondition(request.headers.get("If-Match"), request.headers.get("If-None-Match"))
        if request.content_type != "application/json":
            raise StorageError("invalid_save_request")
        try:
            body = json.loads(request.body)
            if not isinstance(body, dict) or not isinstance(body.get("source"), str):
                raise ValueError
        except RequestDataTooBig:
            raise StorageError("note_too_large", 413) from None
        except (ValueError, UnicodeError):
            raise StorageError("invalid_save_request") from None
        result = save_note(request.user, path, body["source"], base, body.get("mode", "formatted"), body.get("recovery_token"))
        response = JsonResponse(asdict(result), status=result.status)
        if result.revision:
            response["ETag"] = result.revision
        return response
    except StorageError as error:
        return JsonResponse({"state": "error", "reason_code": error.reason_code}, status=error.status)


@login_required
@require_http_methods(['GET', 'POST'])
def drafts(request):
    from .revisions import store_draft, recovery_path
    from .models import RecoveryDraft
    try:
        if request.method == 'POST':
            try:
                body = json.loads(request.body)
                path = body.get('path')
                authorize_content(request, path)
                record = store_draft(request.user, path, body.get('base_revision'), body['source'], body.get('diagnostics', []),
                    base_source=body.get('base_source', ''), bom=body.get('bom', False), newline=body.get('newline', '\n'))
            except (ValueError, KeyError, TypeError, AttributeError):
                raise StorageError('invalid_draft') from None
            except RequestDataTooBig:
                raise StorageError('note_too_large', 413) from None
            return JsonResponse({'id': record.pk, 'url': reverse('wiki:draft', args=[record.pk])}, status=201)
        rows = []
        for row in RecoveryDraft.objects.filter(actor=request.user).order_by('-created_at')[:100]:
            try:
                recovery_path(row.path)
            except StorageError:
                continue
            rows.append(row)
        return render(request, 'wiki/recovery.html', {'drafts': rows})
    except StorageError as error:
        return diagnostic(request, error)


@login_required
@require_GET
def draft(request, draft_id, download=False):
    from .models import RecoveryDraft
    from .revisions import recovery_path
    try:
        try:
            row = RecoveryDraft.objects.get(pk=draft_id, actor=request.user)
        except RecoveryDraft.DoesNotExist:
            raise StorageError('not_found', 404) from None
        recovery_path(row.path)
        source = bytes(row.source).decode('utf-8')
        if download:
            response = HttpResponse((b'\xef\xbb\xbf' if row.bom else b'') + bytes(row.source), content_type='text/plain; charset=utf-8')
            response['Content-Disposition'] = 'attachment; filename="recovery-draft.md"'
            return response
        return render(request, 'wiki/note.html', {'note': {'path': row.path, 'source': source, 'base_source': bytes(row.base_source).decode('utf-8'), 'revision': row.base_revision, 'newline': row.newline, 'bom': row.bom, 'diagnostics': row.diagnostics}, 'recovered_draft': True})
    except StorageError as error:
        return diagnostic(request, error)


@login_required
@require_GET
def history(request, path):
    from .models import SavedRevision
    from .revisions import recovery_path
    try:
        authorize_content(request, path)
        recovery_path(path)
        rows = SavedRevision.objects.filter(path=path).order_by('-created_at')[:100]
        return render(request, 'wiki/recovery.html', {'history': rows, 'history_path': path})
    except StorageError as error:
        return diagnostic(request, error)


@login_required
@require_http_methods(['POST'])
def restore(request, revision_id):
    from .revisions import restore_revision
    try:
        base = parse_precondition(request.headers.get('If-Match'), request.headers.get('If-None-Match'))
        result = restore_revision(request.user, revision_id, base)
        return JsonResponse(asdict(result), status=result.status)
    except StorageError as error:
        return JsonResponse({'reason_code': error.reason_code}, status=error.status)


@login_required
@require_GET
def revision(request, revision_id):
    from .models import SavedRevision
    from .revisions import recovery_path
    try:
        try:
            row = SavedRevision.objects.get(pk=revision_id)
        except SavedRevision.DoesNotExist:
            raise StorageError('not_found', 404) from None
        recovery_path(row.path)
        raw = bytes(row.original)
        bom = raw.startswith(b'\xef\xbb\xbf')
        source = (raw[3:] if bom else raw).decode('utf-8')
        return render(request, 'wiki/note.html', {'note': {'path': row.path, 'source': source, 'base_source': source, 'revision': row.base_revision,
            'newline': '\r\n' if '\r\n' in source else '\r' if '\r' in source else '\n', 'bom': bom}, 'recovered_draft': True, 'restoration_id': row.pk})
    except StorageError as error:
        return diagnostic(request, error)


@login_required
@require_GET
def navigation(request):
    from .navigation import note_navigation
    try:
        authorize_content(request, '', 'folder')
        return JsonResponse(note_navigation(request.GET.get('date'), request.GET.get('timezone')))
    except StorageError as error:
        return JsonResponse({'reason_code': error.reason_code}, status=error.status)
