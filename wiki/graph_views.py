"""Thin authenticated HTML/JSON adapters to the shared saved-index service."""
from dataclasses import asdict
from urllib.parse import urlencode

from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.views.decorators.http import require_GET
from indexing.graph import query_graph, query_links, query_link_issues
from .contracts import StorageError
from .policy import authorize_content
from .tool_views import _json, _tool


SCHEMAS = {
    'graph': {'path', 'depth', 'folder', 'tag', 'query', 'cursor', 'node_limit', 'edge_limit'},
    'links': {'path', 'direction', 'cursor', 'limit'},
    'issues': {'folder', 'issue', 'cursor', 'limit'},
}


def arguments(request, kind, *, form=False):
    if set(request.GET) - SCHEMAS[kind] or any(len(values) != 1 for _, values in request.GET.lists()):
        raise StorageError('invalid_arguments')
    result = dict(request.GET.items())
    if form and result.get('path') == '':
        result.pop('path')
    for name in ('limit', 'node_limit', 'edge_limit', 'depth'):
        if name in result:
            raw = result[name]
            if not raw.isascii() or not raw.isdecimal() or len(raw) > 3:
                raise StorageError('invalid_limit')
            result[name] = int(raw)
    if 'path' in result:
        result['path'] = authorize_content(request, result['path'], query_parameter='path')
    if 'folder' in result:
        result['folder'] = authorize_content(request, result['folder'], 'folder', query_parameter='folder')
    authorize_content(request, '', 'folder')
    if kind == 'links' and not {'path', 'direction'} <= result.keys():
        raise StorageError('invalid_arguments')
    return result


@_tool
def graph(request):
    page = query_graph(**arguments(request, 'graph'))
    return _json(asdict(page), 503 if page.state == 'unavailable' else 200)


@_tool
def links(request):
    page = query_links(**arguments(request, 'links'))
    return _json(asdict(page), 503 if page.state == 'unavailable' else 200)


@_tool
def issues(request):
    page = query_link_issues(**arguments(request, 'issues'))
    return _json(asdict(page), 503 if page.state == 'unavailable' else 200)


@login_required
@require_GET
def page(request):
    try:
        params = arguments(request, 'graph', form=True)
        result = query_graph(**params)
        next_url = '?' + urlencode({**params, 'cursor': result.next_cursor}) if result.next_cursor else None
        return render(request, 'wiki/graph.html', {'graph': result, 'graph_data': asdict(result),
                                                 'graph_params': params, 'graph_next_url': next_url})
    except StorageError as error:
        return render(request, 'wiki/status.html', {'diagnostic': error.reason_code}, status=error.status)
