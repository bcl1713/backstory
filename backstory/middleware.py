import secrets


class ResponsePolicyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.csp_style_nonce = secrets.token_urlsafe(24)
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
        return response


def client_ip(request):
    # REMOTE_ADDR comes from the connection; forwarded/Access headers are ignored.
    return request.META.get('REMOTE_ADDR')


def lockout(request, credentials=None, *args, **kwargs):
    from django.http import HttpResponse
    return HttpResponse('Sign in temporarily unavailable. Try again later.', status=429)
