from dataclasses import asdict
import pytest
from tests.integration.test_storage import wiki
from tests.integration.test_browsing import reader
from tests.integration.test_graph_index import build_graph

pytestmark = pytest.mark.django_db(transaction=True)


def test_graph_tools_share_bounded_service_and_private_session(reader, client, wiki):
    from django.test import Client
    anonymous = Client()
    graph = build_graph(wiki, {'a.md': '[[b]] [[missing]]', 'b.md': '# B'})
    for endpoint, params, expected in [
        ('links', {'path': 'a.md', 'direction': 'both'}, asdict(graph.query_links('a.md', 'both'))),
        ('graph', {'path': 'a.md'}, asdict(graph.query_graph('a.md'))),
        ('link-issues', {'issue': 'missing'}, asdict(graph.query_link_issues(issue='missing'))),
    ]:
        assert anonymous.get(f'/tools/{endpoint}/', params).status_code == 401
        assert reader.post(f'/tools/{endpoint}/', params).status_code == 405
        response = reader.get(f'/tools/{endpoint}/', params)
        assert response.status_code == 200
        data = response.json()
        for key in ('items', 'nodes', 'edges'):
            if key in expected:
                import json
                assert data[key] == json.loads(json.dumps(expected[key]))
        assert data['authoritative'] is False and data['untrusted_content'] is True
        assert response['Cache-Control'] == 'no-store'
        assert 'Access-Control-Allow-Origin' not in response


@pytest.mark.parametrize('endpoint,params', [
    ('graph', {'node_limit': 201}), ('graph', {'depth': 9}), ('graph', {'depth': 0}), ('graph', {'query': 'x' * 257}),
    ('graph', {'unknown': 1}), ('graph', {'path': '../outside.md'}),
    ('links', {'path': 'a.md', 'direction': 'sideways'}), ('links', {'path': 'a.md', 'limit': 'true'}),
    ('link-issues', {'issue': 'fix'}), ('graph', {'edge_limit': 0}),
])
def test_graph_tools_reject_invalid_arguments_before_querying(reader, wiki, endpoint, params):
    assert reader.get(f'/tools/{endpoint}/', params).status_code in {400, 404}


def test_obsolete_graph_cursor_is_explicit_restart(reader, wiki):
    build_graph(wiki, {'a.md': '[[b]] [[b]]', 'b.md': '# B'})
    first = reader.get('/tools/links/', {'path': 'a.md', 'direction': 'outgoing', 'limit': 1}).json()
    response = reader.get('/tools/links/', {'path': 'a.md', 'direction': 'incoming', 'limit': 1, 'cursor': first['next_cursor']})
    assert response.status_code == 409 and response.json()['restart'] is True


def test_graph_has_server_rendered_list_without_javascript(reader, wiki):
    build_graph(wiki, {'a.md': '[[b]]', 'b.md': '# B'})
    response = reader.get('/graph/', {'path': 'a.md'})
    assert response.status_code == 200
    assert b'/notes/b.md' in response.content
    assert b'Indexed saved content' in response.content


def test_server_filter_form_can_submit_blank_center_for_overview(reader, wiki):
    build_graph(wiki, {'a.md': '[[b]]', 'b.md': '# B'})
    response = reader.get('/graph/', {'path': '', 'query': '', 'folder': '', 'tag': '', 'depth': '1'})
    assert response.status_code == 200
    assert b'/notes/b.md' in response.content
    # The tool's exact-path schema still rejects an explicitly empty path.
    assert reader.get('/tools/graph/', {'path': ''}).status_code == 404


def test_graph_depth_http_bounds_and_tool_schema(reader, wiki):
    build_graph(wiki, {'a.md': '[[b]]', 'b.md': '[[c]]', 'c.md': '[[d]]', 'd.md': '# D'})
    for depth in (1, 3, 8):
        response = reader.get('/tools/graph/', {'path': 'a.md', 'depth': depth})
        assert response.status_code == 200
        assert len(response.json()['nodes']) == min(depth + 1, 4)
        assert response.json()['limits']['depth'] == 8
