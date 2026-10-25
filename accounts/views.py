from django.contrib.auth.views import LoginView, LogoutView


class SignInView(LoginView):
    template_name = "registration/login.html"


class SignOutView(LogoutView):
    http_method_names = ["post", "options"]


from django.contrib.auth.decorators import login_required
from django.http import Http404
from django.shortcuts import redirect, render
from django.views.decorators.http import require_http_methods
from .models import SessionDevice
from .sessions import revoke_sessions


@login_required
@require_http_methods(['GET', 'POST'])
def devices(request):
    if request.method == 'POST':
        value = request.POST.get('device', '')
        if not value.isdecimal() or not SessionDevice.objects.filter(pk=value, user=request.user).exists():
            raise Http404
        revoke_sessions(request.user, value)
        return redirect('devices')
    return render(request, 'accounts/devices.html', {'devices': SessionDevice.objects.filter(user=request.user, revoked_at=None).order_by('-created_at')})
