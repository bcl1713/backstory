"""The one approved fixed, authenticated renderer document; no note data here."""
import json
import re
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import Http404, HttpResponse
from django.template.loader import render_to_string
from django.views.decorators.http import require_GET
from .checks import exact_renderer_origin


class MermaidFrameResponse(HttpResponse):
    pass


def renderer_origin(request):
    origin = settings.BACKSTORY_MERMAID_PARENT_ORIGIN
    if (exact_renderer_origin(origin, settings.ALLOWED_HOSTS, settings.BACKSTORY_COOKIE_MODE)
            and origin == f'{request.scheme}://{request.get_host()}'):
        return origin
    return None


@login_required
@require_GET
def mermaid_frame(request):
    origin = renderer_origin(request)
    if not origin or request.META.get('QUERY_STRING'):
        raise Http404
    try:
        manifest = json.loads((settings.BASE_DIR / 'static/renderers/manifest.json').read_text())
        bundle = manifest['frame']
        if not re.fullmatch(r'mermaid-frame-[A-Z0-9]+\.js', bundle):
            raise ValueError
    except (OSError, ValueError, KeyError, TypeError):
        raise Http404 from None
    return MermaidFrameResponse(render_to_string('renderers/mermaid-frame.html', {
        'parent_origin': origin, 'bundle': bundle, 'script_nonce': request.csp_script_nonce,
    }), content_type='text/html; charset=utf-8')


def successful_mermaid_shell(request, response):
    match = getattr(request, 'resolver_match', None)
    return (request.method == 'GET' and match is not None
            and match.url_name == 'mermaid_frame' and match.func is mermaid_frame
            and request.path == '/renderers/mermaid-frame/'
            and not request.META.get('QUERY_STRING')
            and getattr(request, 'user', None) is not None
            and request.user.is_authenticated and request.user.is_active
            and isinstance(response, MermaidFrameResponse) and response.status_code == 200
            and response.get('Content-Type', '').startswith('text/html;')
            and renderer_origin(request) is not None)


def renderer_context(request):
    """A request-specific UI boolean, never note source or an origin fallback."""
    from .isolated_renderers import graphviz_origin
    mermaid_enabled = renderer_origin(request) is not None
    graphviz_enabled = graphviz_origin(request) is not None
    return {'mermaid_enabled': mermaid_enabled, 'graphviz_enabled': graphviz_enabled,
            'diagrams_enabled': mermaid_enabled or graphviz_enabled}
