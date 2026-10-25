"""Public process liveness deliberately excludes private readiness/freshness."""
from django.http import JsonResponse
from django.views.decorators.http import require_GET


@require_GET
def health(request):
    return JsonResponse({'web': 'ok'})
