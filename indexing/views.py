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


@login_required
@require_GET
def search(request):
    from .search import search_notes
    from django.shortcuts import render
    from urllib.parse import urlencode
    query = request.GET.get('q', '')
    try:
        page = search_notes(query, request.GET.get('cursor'))
        context = {'query': query, 'page': page}
        if page.next_cursor:
            context['next_url'] = '?' + urlencode({'q': query, 'cursor': page.next_cursor})
        return render(request, 'wiki/search.html', context)
    except StorageError as error:
        return render(request, 'wiki/search.html', {'query': query[:256], 'diagnostic': error.reason_code}, status=error.status)


@login_required
@require_GET
def resolve(request):
    from wiki.links import resolve_link
    try:
        source = authorize_content(request, request.GET.get('source', ''), query_parameter='source')
        from wiki.policy import _strict_uri_component
        for pair in request.META.get('QUERY_STRING', '').split('&'):
            key, _, value = pair.partition('=')
            if _strict_uri_component(key, form=True) in {'target', 'kind'}:
                _strict_uri_component(value, form=True)
        result = resolve_link(source, request.GET.get('target', ''), request.GET.get('kind', 'wiki'))
        return JsonResponse(asdict(result))
    except StorageError as error:
        return JsonResponse({'state': 'missing', 'href': None, 'label': 'Missing link'}, status=error.status)
