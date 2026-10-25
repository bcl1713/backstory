import secrets


class ResponsePolicyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.csp_style_nonce = secrets.token_urlsafe(24)
        response = self.get_response(request)
        response["Cache-Control"] = "no-store"
        response["Content-Security-Policy"] = f"default-src 'self'; script-src 'self'; style-src 'self' 'nonce-{request.csp_style_nonce}'; img-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
        response["Referrer-Policy"] = "same-origin"
        return response
