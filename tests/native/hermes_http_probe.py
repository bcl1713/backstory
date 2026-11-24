"""Execute only selected installed Hermes helper ASTs with synthetic scaffolding.

No Hermes package/config loader/profile/secret source is imported or accessed.
The actual HTTP method and credential/redirect helpers feed the real SDK client;
only its network transport and secret resolver are replaced by synthetic inputs.
"""
import ast
import contextlib
import hashlib
from pathlib import Path
import re
import sys
import types
from typing import Optional
from unittest.mock import patch


def selected_ast(source, filename, names, *, method=None):
    tree = ast.parse((source / filename).read_text())
    if method:
        owner = next(node for node in tree.body if isinstance(node, ast.ClassDef) and node.name == method[0])
        return [node for node in owner.body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == method[1]]
    result = []
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)) and node.name in names:
            result.append(node)
        elif isinstance(node, ast.Assign) and any(isinstance(target, ast.Name) and target.id in names for target in node.targets):
            result.append(node)
    return result


async def exercise_shipped_helpers(app, endpoint, peer, token, scratch, source):
    import httpx2
    from mcp.client.session import ClientSession
    from mcp.client.streamable_http import streamable_http_client

    source = Path(source)
    if not source.is_absolute():
        raise ValueError('explicit absolute Hermes tools source required for optional compatibility proof')
    namespace = {'re': re, 'Optional': Optional, 'contextlib': contextlib,
                 '_CONTEXT_VAR_RESOLVERS': {}}
    selections = {
        'mcp_tool_common.py': {'_env_ref_name'},
        'mcp_tool_config.py': {'_ENV_VAR_PATTERN', '_RenderedStr', '_interpolate_env_vars', '_require_rendered_remote'},
        'mcp_tool_errors.py': {'_MCP_HTTP_MAX_BODY_BYTES', '_SSE_BOUNDARY_RE', '_SSE_BOUNDARY_CARRY',
                               '_make_redirect_header_stripper', '_make_mcp_body_cap_transport'},
        'mcp_tool_transport.py': {'_present'},
    }
    for filename, names in selections.items():
        nodes = selected_ast(source, filename, names)
        exec(compile(ast.Module(body=nodes, type_ignores=[]), str(source / filename), 'exec'), namespace)

    secret_module = types.ModuleType('agent.secret_scope')
    agent_module = types.ModuleType('agent')
    agent_module.__path__ = []
    secret_module.get_secret = lambda name, fallback=None: token if name == 'SYNTHETIC_BACKSTORY_BEARER' else fallback
    with patch.dict(sys.modules, {'agent': agent_module, 'agent.secret_scope': secret_module}):
        config = namespace['_interpolate_env_vars']({'url': endpoint,
                    'headers': {'Authorization': 'Bearer ${env:SYNTHETIC_BACKSTORY_BEARER}'}})
        namespace['_require_rendered_remote']('synthetic-only', config)
        assert config['headers']['Authorization'] == 'Bearer ' + token
        missing = namespace['_interpolate_env_vars']({'url': endpoint, 'headers': {'Authorization': 'Bearer ${MISSING_SYNTHETIC}'}})
        try:
            namespace['_require_rendered_remote']('synthetic-only', missing)
        except ValueError:
            pass
        else:
            raise AssertionError('missing secret reference did not fail closed')

    # Hermes helper constructs the exact SDK-compatible HTTP client and headers.
    # Avoid proxy/environment resolution and any real network/CA-store access.
    class MatchedHttpx:
        def __getattr__(self, name):
            return getattr(httpx2, name)

        def AsyncHTTPTransport(self, **options):
            assert options['verify'] == str(scratch / 'ca.pem')
            return httpx2.ASGITransport(app=app, client=(peer, 54322))

    matched = MatchedHttpx()
    namespace['_core'] = types.SimpleNamespace(_MCP_NEW_HTTP=True, sdk_httpx=lambda: matched,
                                                streamable_http_client=streamable_http_client)
    namespace['_mcp_proxy_mounts'] = lambda *args: None

    async def observe(response):
        pass
    namespace['_make_http_rejection_recorder'] = lambda target: observe
    namespace['asynccontextmanager'] = contextlib.asynccontextmanager
    method = selected_ast(source, 'mcp_tool_transport.py', set(), method=('MCPServerTransportMixin', '_streamable_http_transport'))
    exec(compile(ast.Module(body=method, type_ignores=[]), str(source / 'mcp_tool_transport.py'), 'exec'), namespace)
    owner = types.SimpleNamespace(name='synthetic-only', _http_rejection={})
    transport = namespace['_streamable_http_transport'](owner, endpoint, config['headers'], 5,
                    str(scratch / 'ca.pem'), None, None, True, {'authorization'})
    async with transport as streams:
        async with ClientSession(*streams) as session:
            result = await session.initialize()
            assert result.protocol_version
            assert len((await session.list_tools()).tools) == 27

    # Exercise the actual shipped redirect-header stripper without network.
    observed = []

    def redirect(request):
        observed.append(request)
        if len(observed) == 1:
            return httpx2.Response(307, headers={'Location': 'https://other.test.invalid/mcp'})
        return httpx2.Response(200)

    factory = namespace['_make_redirect_header_stripper'](httpx2, httpx2.URL(endpoint), strict=True,
                                                           configured_header_names={'authorization', 'x-configured'})
    async with factory(transport=httpx2.MockTransport(redirect), follow_redirects=True,
                       headers={**config['headers'], 'X-Configured': 'synthetic'}) as client:
        response = await client.get(endpoint)
        assert response.status_code == 200 and len(observed) == 2
        assert 'authorization' not in observed[1].headers and 'x-configured' not in observed[1].headers
    return {filename: hashlib.sha256((source / filename).read_bytes()).hexdigest() for filename in selections}
