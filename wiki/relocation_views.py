"""One authenticated preview/review/commit surface for notes and folders."""
from django.contrib.auth.decorators import login_required
from django.db import DatabaseError
from django.shortcuts import redirect, render
from django.views.decorators.http import require_http_methods

from .contracts import StorageError
from .models import MoveOperation
from .policy import authorize_content
from .relocations import commit_move, preview_move, rollback_move


def _pending(request):
    return MoveOperation.objects.filter(actor=request.user, state__in=['applying', 'recovery_required']).order_by('created_at')


@login_required
@require_http_methods(['GET', 'POST'])
def move(request):
    source = request.POST.get('source', '') if request.method == 'POST' else request.GET.get('source', '')
    destination = request.POST.get('destination', '')
    context = {'source': source, 'destination': destination, 'pending_moves': _pending(request),
        'writes_paused': MoveOperation.objects.filter(state__in=['applying', 'recovery_required']).exists()}
    try:
        if source:
            authorize_content(request, source, query_parameter='source' if request.method == 'GET' else None)
        if request.method == 'POST':
            authorize_content(request, destination)
            operation = preview_move(request.user, source, destination)
            return redirect('wiki:move-operation', operation_id=operation.pk)
        return render(request, 'wiki/move.html', context)
    except StorageError as error:
        context['diagnostic'] = error.reason_code
        context['inventory_failure'] = getattr(error, 'inventory_failure', None)
        return render(request, 'wiki/move.html', context, status=error.status)
    except (OSError, DatabaseError):
        context['diagnostic'] = 'move_storage_unavailable'
        return render(request, 'wiki/move.html', context, status=503)


@login_required
@require_http_methods(['GET', 'POST'])
def operation(request, operation_id):
    context = {'pending_moves': _pending(request)}
    try:
        try:
            record = MoveOperation.objects.get(pk=operation_id, actor=request.user)
        except MoveOperation.DoesNotExist:
            raise StorageError('not_found', 404) from None
        authorize_content(request, record.source)
        authorize_content(request, record.destination)
        context['operation'] = record
        if request.method == 'POST':
            action = request.POST.get('action')
            if action not in {'commit', 'rollback'}:
                raise StorageError('invalid_move_action')
            context['result'] = (rollback_move if action == 'rollback' else commit_move)(request.user, record.pk)
            record.refresh_from_db()
        from indexing.worker import index_status
        context['index'] = index_status()
        return render(request, 'wiki/move.html', context)
    except StorageError as error:
        context['diagnostic'] = error.reason_code
        return render(request, 'wiki/move.html', context, status=error.status)
    except (OSError, DatabaseError):
        context['diagnostic'] = 'move_outcome_unconfirmed'
        return render(request, 'wiki/move.html', context, status=503)
