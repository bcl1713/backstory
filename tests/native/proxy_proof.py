"""Listener-free production proxy admission and shared operations; synthetic state."""
import asyncio
import json
import os
from pathlib import Path
import socket
import sqlite3
from unittest.mock import patch


async def proof():
    import httpx2
    from mcp.client.session import ClientSession
    from mcp.client.streamable_http import streamable_http_client
    from backstory.native_https import create_app, parse_settings, server_config

    wiki, data = Path(os.environ['BACKSTORY_WIKI_ROOT']), Path(os.environ['BACKSTORY_DATA_DIR'])
    selected = parse_settings(['--proxy-only', '--wiki-root', str(wiki), '--data-dir', str(data),
        '--bind-ip', '192.168.80.3', '--npm-ip', '192.168.80.2', '--port', '8001',
        '--endpoint', 'https://client.test.invalid/mcp'])
    url = 'http://192.168.80.3:8001/mcp'
    headers = {'Host': 'client.test.invalid', 'Accept': 'application/json, text/event-stream'}

    def actor_count():
        with sqlite3.connect(data / 'backstory.sqlite3') as db:
            return db.execute('SELECT COUNT(*) FROM wiki_localactor').fetchone()[0]

    def forbidden(*args, **kwargs):
        raise AssertionError('network sockets prohibited in ASGI proof')

    with patch.object(socket.socket, 'bind', forbidden), patch.object(socket.socket, 'listen', forbidden), \
         patch.object(socket.socket, 'connect', forbidden), patch.object(socket.socket, 'connect_ex', forbidden):
        app = create_app(selected)
        config = server_config(app, selected)
        config.load()
        assert not config.is_ssl and config.ssl is None
        assert config.host == selected.bind_ip and config.port == 8001
        assert not config.proxy_headers and config.forwarded_allow_ips == ''
        async with app.lifespan():
            denials = [('192.168.80.4', headers, url, 403, 'proxy_peer_or_transport_denied'),
                ('192.168.80.4', {**headers, 'X-Forwarded-For': selected.npm_ip, 'X-Real-IP': selected.npm_ip}, url, 403, 'proxy_peer_or_transport_denied'),
                (selected.npm_ip, {**headers, 'Authorization': 'Basic synthetic'}, url, 403, 'upstream_credentials_denied'),
                (selected.npm_ip, {**headers, 'Authorization': ''}, url, 403, 'upstream_credentials_denied'),
                (selected.npm_ip, {**headers, 'Host': 'other.test.invalid'}, url, 421, 'host_denied'),
                (selected.npm_ip, {**headers, 'Origin': 'https://client.test.invalid'}, url, 403, 'origin_denied'),
                (selected.npm_ip, headers, url.replace('http:', 'https:'), 403, 'proxy_peer_or_transport_denied'),
                (selected.npm_ip, headers, url + '/', 404, 'endpoint_not_found')]
            for peer, supplied, endpoint, code, reason in denials:
                async with httpx2.AsyncClient(transport=httpx2.ASGITransport(app=app, client=(peer, 12345)),
                                             trust_env=False) as http:
                    response = await http.post(endpoint, headers=supplied, json={})
                assert response.status_code == code and response.json()['reason_code'] == reason
                assert response.json()['request_started'] is False and actor_count() == 0
            # NPM defaults may send these; their poisoned values never establish identity.
            ignored = {**headers, 'X-Forwarded-For': '8.8.8.8', 'X-Real-IP': '8.8.8.8',
                       'Forwarded': 'for=8.8.8.8;proto=https', 'X-Forwarded-Proto': 'https', 'X-Authenticated-User': 'not-an-actor'}
            async with httpx2.AsyncClient(transport=httpx2.ASGITransport(app=app, client=(selected.npm_ip, 12345)),
                                         headers=ignored, trust_env=False) as http:
                too_large = await http.post(url, headers={'Content-Length': str(16 * 1024 * 1024 + 1),
                                           'Content-Type': 'application/json'}, content=b'{}')
                assert too_large.status_code == 413 and actor_count() == 0
                async with streamable_http_client(url, http_client=http) as streams:
                    async with ClientSession(*streams) as client:
                        initialized = await client.initialize()
                        assert len((await client.list_tools()).tools) == 28

                        async def call(name, args):
                            result = await client.call_tool(name, args)
                            return result, json.loads(result.content[0].text)

                        _, status = await call('wiki_status', {})
                        assert status['storage']['state'] == 'ready' and actor_count() == 1
                        assert status['native_mcp']['transport'] == 'streamable_http_proxy'
                        _, created = await call('create_note', {'path': 'proxy.md', 'source': '# Proxy synthetic\n'})
                        assert created['authoritative']
                        _, initial = await call('read_note', {'path': 'proxy.md'})
                        _, saved = await call('save_note', {'path': 'proxy.md', 'source': '# Guarded proxy\n',
                                                          'revision': initial['revision']})
                        assert saved['authoritative']
                        _, readback = await call('read_note', {'path': 'proxy.md'})
                        assert readback['revision'] == saved['revision']
                        before = (wiki / 'proxy.md').read_bytes()
                        result, stale = await call('save_note', {'path': 'proxy.md', 'source': '# Must refuse\n',
                                                              'revision': initial['revision']})
                        assert result.is_error and stale['state'] == 'conflict'
                        assert (wiki / 'proxy.md').read_bytes() == before
                        _, denied = await call('read_note', {'path': '../outside.md'})
                        assert denied['state'] == 'error'
        print(json.dumps({'protocol': initialized.protocol_version, 'tools': 28,
            'pre_access_denials': len(denials), 'forwarding_headers': 'ignored, not authority',
            'backend_credentials': 'absent', 'guarded_save_readback_stale': True,
            'body_bound_before_access': True, 'proof': 'ASGI production app; no listener or Nginx/TLS claim'}))


if __name__ == '__main__':
    assert os.environ.get('BACKSTORY_PROXY_PROOF_SCRATCH')
    import django
    django.setup()
    asyncio.run(proof())
