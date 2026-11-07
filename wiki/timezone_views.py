from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.views.decorators.http import require_http_methods
from .contracts import StorageError
from .timezones import timezone_state, change_timezone


@login_required
@require_http_methods(['GET', 'POST'])
def timezone_settings(request):
    owner = request.user.is_active and (request.user.is_staff or request.user.is_superuser)
    wants_json = request.GET.get('format') == 'json' or 'application/json' in request.headers.get('Accept', '')
    status = 200
    error = ''
    if request.method == 'POST':
        if not owner:
            return JsonResponse({'reason_code': 'wiki_timezone_owner_required'}, status=403)
        try:
            action = request.POST.get('action')
            if action not in {'initialize', 'override'}:
                raise StorageError('invalid_timezone_action')
            change_timezone(request.POST.get('timezone'), initialize=action == 'initialize', expected=request.POST.get('expected_timezone'))
            if not wants_json:
                return redirect('wiki:timezone-settings')
        except StorageError as exc:
            status, error = exc.status, exc.reason_code
    current = timezone_state()
    context = {**current, 'can_change': bool(owner and current['source'] != 'environment'), 'error': error}
    return JsonResponse(context, status=status) if wants_json else render(request, 'wiki/timezone.html', context, status=status)
