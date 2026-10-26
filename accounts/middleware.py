from django.contrib.auth import logout
from django.contrib.auth.views import redirect_to_login
from . import sessions
from .models import SessionDevice


class SessionPolicyMiddleware:
    """Fail closed for every present and future application route."""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            timestamp = sessions.now()
            device = SessionDevice.objects.filter(user=request.user, session_key_digest=sessions.digest(request.session.session_key)).first()
            if (not device or not request.user.is_active or device.revoked_at is not None
                    or timestamp >= device.absolute_expires_at or timestamp >= device.last_seen_at + sessions.idle(device.remembered)):
                logout(request)
            else:
                # Conditional renewal cannot resurrect a concurrently revoked device.
                renewed = SessionDevice.objects.filter(pk=device.pk, revoked_at=None).update(last_seen_at=timestamp)
                if not renewed:
                    logout(request)
                request.session.set_expiry(max(1, int(min(sessions.idle(device.remembered), device.absolute_expires_at - timestamp).total_seconds())))
        if not request.user.is_authenticated and request.path not in {'/accounts/login/', '/health/'} and not request.path.startswith('/static/'):
            if request.path.startswith('/tools/'):
                from django.http import JsonResponse
                return JsonResponse({'state': 'error', 'reason_code': 'authentication_required',
                                     'untrusted_content': True}, status=401)
            return redirect_to_login(request.path)
        return self.get_response(request)
