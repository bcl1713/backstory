from dataclasses import asdict
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from wiki.contracts import StorageError
from wiki.policy import authorize_content
from .models import IndexedNote
from .queue import request_scan
from .worker import index_status


@login_required
@require_GET
def status(request):
    data = asdict(index_status())
    if 'path' in request.GET:
        try:
            path = authorize_content(request, request.GET['path'], query_parameter='path')
        except StorageError as error:
            return JsonResponse({'reason_code': error.reason_code}, status=error.status)
        row = IndexedNote.objects.filter(generation__state='active', path=path).values('revision').first()
        data['indexed_revision'] = row['revision'] if row else None
    return JsonResponse(data)


@login_required
@require_POST
def schedule(request):
    kind = request.POST.get('kind')
    try:
        job = request_scan(kind)
    except ValueError:
        return JsonResponse({'reason_code': 'invalid_scan_kind'}, status=400)
    from django.shortcuts import redirect
    return redirect('wiki:status')
