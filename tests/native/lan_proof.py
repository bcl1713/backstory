"""Explicit authenticated LAN, listener-free SDK HTTP and separate actual TLS."""
import asyncio
from dataclasses import replace
import json
import os
from pathlib import Path
import socket
import sqlite3
import ssl
from unittest.mock import patch

from tests.native.https_proof import certificates, handshake


async def proof():
    import httpx2
    from mcp.client.session import ClientSession
    from mcp.client.streamable_http import streamable_http_client
    from backstory.native_https import HttpsSettings, create_app, server_config

    scratch = Path(os.environ['BACKSTORY_HTTPS_PROOF_SCRATCH'])
    wiki, data = Path(os.environ['BACKSTORY_WIKI_ROOT']), Path(os.environ['BACKSTORY_DATA_DIR'])
    certificates(scratch)
    token = 'synthetic-only-lan-acceptance-bearer-32-characters'
    secret = scratch / 'bearer'
    secret.write_text(token)
    secret.chmod(0o600)
    selected = HttpsSettings(wiki, data, '192.168.50.10', 9443, 'https://backstory.test.invalid:9443/mcp',
                            None, secret, scratch / 'server.pem', scratch / 'server.key', lan_cidr='192.168.50.0/24')
    headers = {'Authorization': 'Bearer ' + token, 'Accept': 'application/json, text/event-stream'}

    def forbidden(*args, **kwargs):
        raise AssertionError('network sockets prohibited')

    def actor_count():
        with sqlite3.connect(data / 'backstory.sqlite3') as db:
            return db.execute('SELECT COUNT(*) FROM wiki_localactor').fetchone()[0]

    with patch.object(socket.socket, 'bind', forbidden), patch.object(socket.socket, 'listen', forbidden), \
         patch.object(socket.socket, 'connect', forbidden), patch.object(socket.socket, 'connect_ex', forbidden):
        app = create_app(selected)
        config = server_config(app, selected)
        config.load()
        assert config.host == selected.bind_ip and config.proxy_headers is False and config.forwarded_allow_ips == ''
        trusted = ssl.create_default_context(cafile=str(scratch / 'ca.pem'))
        tls = handshake(config.ssl, trusted, 'backstory.test.invalid')
        for context, hostname in ((ssl.create_default_context(), 'backstory.test.invalid'), (trusted, 'wrong.test.invalid')):
            try:
                handshake(config.ssl, context, hostname)
            except ssl.SSLCertVerificationError:
                pass
            else:
                raise AssertionError('untrusted/wrong-name TLS accepted')

        async def sdk_read(peer, *, mutate=False, revision=None):
            assert handshake(config.ssl, trusted, 'backstory.test.invalid') == tls
            async with httpx2.AsyncClient(transport=httpx2.ASGITransport(app=app, client=(peer, 12345)),
                                         headers=headers, trust_env=False) as http:
                async with streamable_http_client(selected.endpoint, http_client=http) as streams:
                    async with ClientSession(*streams) as client:
                        initialized = await client.initialize()
                        assert len((await client.list_tools()).tools) == 29

                        async def call(name, args):
                            result = await client.call_tool(name, args)
                            return result, json.loads(result.content[0].text)

                        _, status = await call('wiki_status', {})
                        assert status['storage']['state'] == 'ready'
                        assert status['native_mcp']['transport'] == 'streamable_https'
                        if mutate:
                            _, created = await call('create_note', {'path': 'lan.md', 'source': '# LAN synthetic\n'})
                            assert created['authoritative']
                            _, initial = await call('read_note', {'path': 'lan.md'})
                            _, saved = await call('save_note', {'path': 'lan.md', 'source': '# Guarded LAN\n',
                                                              'revision': initial['revision']})
                            assert saved['authoritative']
                            _, readback = await call('read_note', {'path': 'lan.md'})
                            assert readback['revision'] == saved['revision'] and readback['source'] == saved['source']
                            return initial['revision']
                        if revision:
                            before = (wiki / 'lan.md').read_bytes()
                            result, stale = await call('save_note', {'path': 'lan.md', 'source': '# Must refuse\n',
                                                                  'revision': revision})
                            assert result.is_error and stale['state'] == 'conflict'
                            assert (wiki / 'lan.md').read_bytes() == before
                        return initialized.protocol_version

        async with app.lifespan():
            denials = [({}, '192.168.50.21', 401, 'authentication_required'),
                ({'Authorization': 'Bearer wrong'}, '192.168.50.21', 401, 'authentication_required'),
                (headers, '192.168.51.21', 403, 'peer_or_tls_denied'),
                ({**headers, 'X-Forwarded-For': '192.168.50.21'}, '192.168.51.21', 403, 'peer_or_tls_denied'),
                (headers, '8.8.8.8', 403, 'peer_or_tls_denied'),
                (headers, '::ffff:192.168.50.21', 403, 'peer_or_tls_denied'),
                (headers, 'not-an-ip', 403, 'peer_or_tls_denied'),
                ({**headers, 'Forwarded': 'for=192.168.50.20'}, '192.168.50.21', 403, 'forwarded_peer_denied'),
                ({**headers, 'X-Forwarded-For': '192.168.50.20'}, '192.168.50.21', 403, 'forwarded_peer_denied'),
                ({**headers, 'Host': 'other.test.invalid:9443'}, '192.168.50.21', 421, 'host_denied'),
                ({**headers, 'Origin': 'https://backstory.test.invalid:9443'}, '192.168.50.21', 403, 'origin_denied')]
            for supplied, peer, code, reason in denials:
                async with httpx2.AsyncClient(transport=httpx2.ASGITransport(app=app, client=(peer, 12346)),
                                             trust_env=False) as http:
                    response = await http.post(selected.endpoint, headers=supplied, json={})
                assert response.status_code == code and response.json()['reason_code'] == reason
                assert response.json()['request_started'] is False and actor_count() == 0
            stale_revision = await sdk_read('192.168.50.20', mutate=True)
            protocol = await sdk_read('192.168.50.21', revision=stale_revision)
            assert actor_count() == 1

        forge = create_app(replace(selected, forge_ip='192.168.50.20', lan_cidr=None))
        async with forge.lifespan():
            for peer, expected in (('192.168.50.20', 200), ('192.168.50.21', 403)):
                async with httpx2.AsyncClient(transport=httpx2.ASGITransport(app=forge, client=(peer, 12347)),
                                             headers=headers, trust_env=False) as http:
                    response = await http.post(selected.endpoint, json={'jsonrpc': '2.0', 'id': 2, 'method': 'tools/list'})
                assert response.status_code == expected
                if expected == 200:
                    assert len(response.json()['result']['tools']) == 29
                else:
                    assert response.json()['reason_code'] == 'peer_or_tls_denied'
        print(json.dumps({'protocol': protocol, 'tls': tls, 'lan_clients': 2, 'tools': 29,
            'negative_requests_before_access': len(denials), 'guarded_save_readback': True,
            'cross_peer_stale_no_mutation': True, 'forge_mode_still_restricted': True,
            'proof': 'SDK ASGI plus separate production-context MemoryBIO TLS; no TCP/listener'}))


if __name__ == '__main__':
    assert os.environ.get('BACKSTORY_HTTPS_PROOF_SCRATCH')
    import django
    django.setup()
    asyncio.run(proof())
