import ipaddress
import secrets

from django.conf import settings
from django.http import HttpResponseBadRequest


class ResponsePolicyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.csp_style_nonce = secrets.token_urlsafe(24)
        request.csp_script_nonce = secrets.token_urlsafe(24)
        from django.core.exceptions import DisallowedHost
        from django.http import HttpResponseBadRequest
        try:
            request.get_host()
        except DisallowedHost:
            response = HttpResponseBadRequest("invalid_host")
        else:
            response = self.get_response(request)
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"] = "DENY"
        response["Cache-Control"] = "no-store"
        response["Content-Security-Policy"] = f"default-src 'self'; script-src 'self'; style-src 'self' 'nonce-{request.csp_style_nonce}'; img-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
        response["Referrer-Policy"] = "same-origin"
        from .renderers import successful_mermaid_shell, renderer_origin
        if successful_mermaid_shell(request, response):
            # Remove the inner Django XFrameOptionsMiddleware's header too.
            del response['X-Frame-Options']
            response['Content-Security-Policy'] = (
                "default-src 'none'; "
                f"script-src 'nonce-{request.csp_script_nonce}'; "
                "style-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; "
                "font-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; "
                "worker-src 'none'; base-uri 'none'; form-action 'none'; "
                f"frame-ancestors {renderer_origin(request)}; sandbox allow-scripts"
            )
            response['Referrer-Policy'] = 'no-referrer'
            response['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
        from .isolated_renderers import successful_graphviz_shell, graphviz_origin
        if successful_graphviz_shell(request, response):
            del response['X-Frame-Options']
            response['Content-Security-Policy'] = (
                "default-src 'none'; "
                f"script-src 'nonce-{request.csp_script_nonce}' 'wasm-unsafe-eval'; "
                "style-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; "
                "font-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; "
                "worker-src blob:; base-uri 'none'; form-action 'none'; "
                f"frame-ancestors {graphviz_origin(request)}; sandbox allow-scripts"
            )
            response['Referrer-Policy'] = 'no-referrer'
            response['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
        return response


def literal_ip(value):
    # ipaddress accepts scoped IPv6; scope identifiers are not client addresses.
    if not isinstance(value, str) or '%' in value:
        raise ValueError
    return ipaddress.ip_address(value)


class TrustedProxyMiddleware:
    """Validate the connection before any forwarded value affects application policy."""
    def __init__(self, get_response):
        self.get_response = get_response
        self.mode = settings.BACKSTORY_PROXY_MODE
        self.networks = tuple(ipaddress.ip_network(peer) for peer in settings.BACKSTORY_TRUSTED_PROXY_IPS)
        self.client_header = {
            'none': None, 'x-forwarded-for': 'HTTP_X_FORWARDED_FOR', 'x-real-ip': 'HTTP_X_REAL_IP',
        }[settings.BACKSTORY_PROXY_CLIENT_IP_HEADER]

    def __call__(self, request):
        if self.mode == 'off':
            return self.get_response(request)
        if self.mode != 'trusted':
            return HttpResponseBadRequest('invalid_proxy_mode')
        try:
            peer = literal_ip(request.META.get('REMOTE_ADDR'))
        except ValueError:
            return HttpResponseBadRequest('untrusted_proxy')
        if not any(peer in network for network in self.networks):
            return HttpResponseBadRequest('untrusted_proxy')
        if request.META.get('HTTP_X_FORWARDED_PROTO') != 'https':
            return HttpResponseBadRequest('invalid_proxy_scheme')
        address = peer
        if self.client_header and self.client_header in request.META:
            try:
                address = literal_ip(request.META[self.client_header])
            except ValueError:
                return HttpResponseBadRequest('invalid_proxy_client_ip')
        request.backstory_client_ip = str(address)
        request.META['wsgi.url_scheme'] = 'https'
        return self.get_response(request)


def client_ip(request):
    # Only our peer-validated boundary may supply a forwarded client address.
    if hasattr(request, 'backstory_client_ip'):
        return request.backstory_client_ip
    try:
        return str(literal_ip(request.META.get('REMOTE_ADDR')))
    except ValueError:
        return None


def lockout(request, credentials=None, *args, **kwargs):
    from django.http import HttpResponse
    return HttpResponse('Sign in temporarily unavailable. Try again later.', status=429)
