"""Read-only entry to the standard editor for a linked, missing note."""
from urllib.parse import quote

from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.http import require_GET

from .contracts import StorageError
from .links import _entry_kind, heading_slug, resolve_link
from .policy import _strict_uri_component, authorize_content
from .storage import open_directory, require_ready
from .views import diagnostic


@login_required
@require_GET
def linked_note(request):
    try:
        source = authorize_content(request, request.GET.get('source', ''), query_parameter='source')
        for pair in request.META.get('QUERY_STRING', '').split('&'):
            key, _, value = pair.partition('=')
            if _strict_uri_component(key, form=True) in {'target', 'destination'}:
                _strict_uri_component(value, form=True)
        target = request.GET.get('target', '')
        require_ready()
        result = resolve_link(source, target, 'wiki')
        fragment = target.partition('|')[0].partition('#')[2]
        suffix = '#' + quote('preview-' + heading_slug(fragment), safe='-_') if fragment else ''
        context = {'source_path': source, 'target': target, 'result': result,
                   'choices': [{'path': path, 'href': reverse('wiki:note', args=[path]) + suffix}
                               for path in result.choices]}
        # Even a previously offered action is only a hint. Resolve it again on
        # entry; an existing target is an Open action, never an editable create.
        if result.state == 'resolved':
            context['existing_href'] = result.href
            return render(request, 'wiki/link_destination.html', context)
        if result.state == 'unavailable':
            raise StorageError('link_resolution_unavailable', 503)
        destination = request.GET.get('destination')
        if destination is not None:
            destination = authorize_content(request, destination, query_parameter='destination')
            if not destination.lower().endswith('.md'):
                raise StorageError('path_denied', 404)
        elif result.state == 'ambiguous':
            return render(request, 'wiki/link_destination.html', context)
        else:
            destination = result.create_path
        if not destination:
            raise StorageError('link_not_creatable', 409)
        parent, _, filename = destination.rpartition('/')
        # Never create folders. No-follow directory access and the shared path
        # policy apply to explicit choices as well as prefilled destinations.
        with open_directory(parent):
            pass
        kind = _entry_kind(destination)
        if kind == 'file':
            context['existing_href'] = reverse('wiki:note', args=[destination]) + suffix
            return render(request, 'wiki/link_destination.html', context)
        if kind != 'missing':
            raise StorageError('path_denied', 404)
        require_ready()
        return render(request, 'wiki/note.html', {
            'is_new': True, 'folder': parent, 'filename': filename,
            'link_fragment': suffix,
            'note': {'path': '', 'source': '', 'newline': '\n', 'revision': None},
        })
    except StorageError as error:
        return diagnostic(request, error)
