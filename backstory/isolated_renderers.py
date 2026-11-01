"""Explicitly approved worker renderer shell, never a note execution endpoint."""
import json
import re
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import Http404, HttpResponse
from django.template.loader import render_to_string
from django.views.decorators.http import require_GET
from .checks import exact_renderer_origin

class GraphvizFrameResponse(HttpResponse):
    pass

def graphviz_origin(request):
    origin = settings.BACKSTORY_GRAPHVIZ_PARENT_ORIGIN
    if (exact_renderer_origin(origin, settings.ALLOWED_HOSTS, settings.BACKSTORY_COOKIE_MODE)
            and origin == f'{request.scheme}://{request.get_host()}'):
        return origin
    return None

@login_required
@require_GET
def graphviz_frame(request):
    origin = graphviz_origin(request)
    if not origin or request.META.get('QUERY_STRING'):
        raise Http404
    try:
        manifest = json.loads((settings.BASE_DIR / 'static/renderers/graphviz-manifest.json').read_text())
        bundle = manifest['frame']
        if not isinstance(bundle, str) or not re.fullmatch(r'graphviz-frame-[A-Z0-9]+\.js', bundle):
            raise ValueError
    except (OSError, ValueError, KeyError, TypeError):
        raise Http404 from None
    return GraphvizFrameResponse(render_to_string('renderers/graphviz-frame.html', {
        'parent_origin': origin, 'bundle': bundle, 'script_nonce': request.csp_script_nonce,
    }), content_type='text/html; charset=utf-8')

def successful_graphviz_shell(request, response):
    match = getattr(request, 'resolver_match', None)
    return (request.method == 'GET' and match is not None
            and match.url_name == 'graphviz_frame' and match.func is graphviz_frame
            and request.path == '/renderers/graphviz-frame/'
            and not request.META.get('QUERY_STRING')
            and getattr(request, 'user', None) is not None
            and request.user.is_authenticated and request.user.is_active
            and type(response) is GraphvizFrameResponse and response.status_code == 200
            and response.get('Content-Type', '') == 'text/html; charset=utf-8'
            and graphviz_origin(request) is not None)


class VegaLiteFrameResponse(HttpResponse):
    pass

def vega_lite_origin(request):
    origin = settings.BACKSTORY_VEGA_LITE_PARENT_ORIGIN
    if (exact_renderer_origin(origin, settings.ALLOWED_HOSTS, settings.BACKSTORY_COOKIE_MODE)
            and origin == f'{request.scheme}://{request.get_host()}'):
        return origin
    return None

@login_required
@require_GET
def vega_lite_frame(request):
    origin = vega_lite_origin(request)
    if not origin or request.META.get('QUERY_STRING'):
        raise Http404
    try:
        manifest = json.loads((settings.BASE_DIR / 'static/renderers/vega-lite-manifest.json').read_text())
        bundle = manifest['frame']
        if not isinstance(bundle, str) or not re.fullmatch(r'vega-lite-frame-[A-Z0-9]+\.js', bundle):
            raise ValueError
    except (OSError, ValueError, KeyError, TypeError):
        raise Http404 from None
    return VegaLiteFrameResponse(render_to_string('renderers/vega-lite-frame.html', {
        'parent_origin': origin, 'bundle': bundle, 'script_nonce': request.csp_script_nonce,
    }), content_type='text/html; charset=utf-8')

def successful_vega_lite_shell(request, response):
    match = getattr(request, 'resolver_match', None)
    return (request.method == 'GET' and match is not None
            and match.url_name == 'vega_lite_frame' and match.func is vega_lite_frame
            and request.path == '/renderers/vega-lite-frame/'
            and not request.META.get('QUERY_STRING')
            and getattr(request, 'user', None) is not None
            and request.user.is_authenticated and request.user.is_active
            and type(response) is VegaLiteFrameResponse and response.status_code == 200
            and response.get('Content-Type', '') == 'text/html; charset=utf-8'
            and vega_lite_origin(request) is not None)
