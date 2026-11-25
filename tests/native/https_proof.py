"""Listener-free production ASGI and actual TLS proof; synthetic state only."""
import asyncio
from dataclasses import replace
from datetime import datetime, timedelta, timezone
from contextlib import redirect_stderr
import io
import json
import os
from pathlib import Path
import socket
import sqlite3
import ssl
import threading
from unittest.mock import patch


def certificates(scratch):
    from cryptography import x509
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.x509.oid import NameOID, ExtendedKeyUsageOID

    now = datetime.now(timezone.utc)
    ca_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    ca_name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, 'Synthetic task CA')])
    ca = (x509.CertificateBuilder().subject_name(ca_name).issuer_name(ca_name)
          .public_key(ca_key.public_key()).serial_number(x509.random_serial_number())
          .not_valid_before(now - timedelta(minutes=1)).not_valid_after(now + timedelta(days=1))
          .add_extension(x509.BasicConstraints(ca=True, path_length=0), critical=True)
          .add_extension(x509.SubjectKeyIdentifier.from_public_key(ca_key.public_key()), critical=False)
          .add_extension(x509.KeyUsage(digital_signature=True, content_commitment=False,
                         key_encipherment=False, data_encipherment=False, key_agreement=False,
                         key_cert_sign=True, crl_sign=True, encipher_only=False, decipher_only=False), critical=True)
          .sign(ca_key, hashes.SHA256()))
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    cert = (x509.CertificateBuilder()
            .subject_name(x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, 'backstory.test.invalid')]))
            .issuer_name(ca_name).public_key(key.public_key()).serial_number(x509.random_serial_number())
            .not_valid_before(now - timedelta(minutes=1)).not_valid_after(now + timedelta(days=1))
            .add_extension(x509.SubjectAlternativeName([x509.DNSName('backstory.test.invalid')]), critical=False)
            .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
            .add_extension(x509.AuthorityKeyIdentifier.from_issuer_public_key(ca_key.public_key()), critical=False)
            .add_extension(x509.SubjectKeyIdentifier.from_public_key(key.public_key()), critical=False)
            .add_extension(x509.ExtendedKeyUsage([ExtendedKeyUsageOID.SERVER_AUTH]), critical=False)
            .sign(ca_key, hashes.SHA256()))
    for name, raw in (
        ('ca.pem', ca.public_bytes(serialization.Encoding.PEM)),
        ('server.pem', cert.public_bytes(serialization.Encoding.PEM)),
        ('server.key', key.private_bytes(serialization.Encoding.PEM,
                                         serialization.PrivateFormat.PKCS8,
                                         serialization.NoEncryption()))):
        path = scratch / name
        path.write_bytes(raw)
        path.chmod(0o600)


def handshake(server_context, client_context, name):
    """Exchange real TLS records using MemoryBIO, never bind/connect a socket."""
    si, so, ci, co = (ssl.MemoryBIO() for _ in range(4))
    server = server_context.wrap_bio(si, so, server_side=True)
    client = client_context.wrap_bio(ci, co, server_side=False, server_hostname=name)
    done = set()
    for _ in range(100):
        for label, connection in (('client', client), ('server', server)):
            if label not in done:
                try:
                    connection.do_handshake()
                    done.add(label)
                except ssl.SSLWantReadError:
                    pass
            if co.pending:
                si.write(co.read())
            if so.pending:
                ci.write(so.read())
        if len(done) == 2:
            client.write(b'synthetic application data')
            si.write(co.read())
            assert server.read() == b'synthetic application data'
            return client.version()
    raise AssertionError('bounded TLS handshake did not finish')


async def proof():
    import httpx2
    from mcp.client.session import ClientSession
    from mcp.client.streamable_http import streamable_http_client
    from backstory.native_https import HttpsSettings, create_app, parse_settings, server_config

    scratch = Path(os.environ['BACKSTORY_HTTPS_PROOF_SCRATCH'])
    wiki, data = Path(os.environ['BACKSTORY_WIKI_ROOT']), Path(os.environ['BACKSTORY_DATA_DIR'])
    certificates(scratch)
    token = 'synthetic-only-bearer-value-with-at-least-32-characters'
    token_file = scratch / 'token'
    token_file.write_text(token + '\n')
    token_file.chmod(0o600)
    selected = HttpsSettings(wiki, data, '192.168.50.10', 9443,
                             'https://backstory.test.invalid:9443/mcp', '192.168.50.20',
                             token_file, scratch / 'server.pem', scratch / 'server.key')
    args = ['--https', '--wiki-root', str(wiki), '--data-dir', str(data),
            '--bind-ip', selected.bind_ip, '--port', '9443', '--endpoint', selected.endpoint,
            '--forge-ip', selected.forge_ip, '--token-file', str(token_file),
            '--tls-cert', str(selected.cert_file), '--tls-key', str(selected.key_file)]
    assert parse_settings(args) == selected
    checks = []
    for change in ({'--https': None}, {'--bind-ip': '0.0.0.0'}, {'--bind-ip': '::'},
                   {'--bind-ip': '127.0.0.1'}, {'--bind-ip': '8.8.8.8'},
                   {'--forge-ip': '192.168.50.0/24'}, {'--forge-ip': selected.bind_ip},
                   {'--endpoint': 'http://backstory.test.invalid:9443/mcp'},
                   {'--endpoint': 'https://*.test.invalid:9443/mcp'},
                   {'--endpoint': 'https://backstory.test.invalid:9444/mcp'}):
        altered = list(args)
        for flag, value in change.items():
            index = altered.index(flag)
            if value is None:
                altered.pop(index)
            else:
                altered[index + 1] = value
        try:
            with redirect_stderr(io.StringIO()):
                parse_settings(altered)
        except SystemExit as error:
            assert error.code == 2
        else:
            raise AssertionError('unsafe/missing explicit configuration was accepted')
        checks.append('configuration_refusal')
    for flag in ('--anonymous', '--proxy-headers'):
        try:
            with redirect_stderr(io.StringIO()):
                parse_settings([*args, flag])
        except SystemExit as error:
            assert error.code == 2
        else:
            raise AssertionError('anonymous/proxy fallback option was accepted')
        checks.append('no_anonymous_or_proxy_option')

    # Unsafe secret files refuse before any actor/access work.
    token_file.chmod(0o644)
    try:
        create_app(selected)
    except ValueError:
        pass
    else:
        raise AssertionError('public-readable bearer accepted')
    token_file.chmod(0o600)
    token_link = scratch / 'token-link'
    token_link.symlink_to(token_file)
    try:
        create_app(replace(selected, token_file=token_link))
    except ValueError:
        pass
    else:
        raise AssertionError('symlink bearer accepted')
    checks.extend(['private_token_permissions', 'no_follow_token'])

    # Make any accidental network listener/client connection an immediate failure.
    def forbidden(*args, **kwargs):
        raise AssertionError('network bind/listen/connect is prohibited in this proof')

    with patch.object(socket.socket, 'bind', forbidden), patch.object(socket.socket, 'listen', forbidden), \
         patch.object(socket.socket, 'connect', forbidden), patch.object(socket.socket, 'connect_ex', forbidden):
        app = create_app(selected)
        config = server_config(app, selected)
        config.load()  # constructs the production TLS context; never runs the server
        assert config.host == selected.bind_ip and config.port == 9443
        assert config.proxy_headers is False and config.forwarded_allow_ips == ''
        trusted = ssl.create_default_context(cafile=str(scratch / 'ca.pem'))
        tls_version = handshake(config.ssl, trusted, 'backstory.test.invalid')
        assert tls_version in {'TLSv1.2', 'TLSv1.3'}
        checks.append('verified_tls')
        for context, hostname in ((ssl.create_default_context(), 'backstory.test.invalid'),
                                  (trusted, 'wrong.test.invalid')):
            try:
                handshake(config.ssl, context, hostname)
            except ssl.SSLCertVerificationError:
                pass
            else:
                raise AssertionError('untrusted/wrong-name TLS connection accepted')
            checks.append('tls_refusal')

        def actor_count():
            with sqlite3.connect(data / 'backstory.sqlite3') as db:
                return db.execute('SELECT COUNT(*) FROM wiki_localactor').fetchone()[0]

        assert actor_count() == 0
        headers = {'Authorization': 'Bearer ' + token, 'Accept': 'application/json, text/event-stream'}
        async with app.lifespan():
            cases = [({}, selected.forge_ip, selected.endpoint, 401),
                     ({'Authorization': 'Bearer wrong'}, selected.forge_ip, selected.endpoint, 401),
                     (headers, '192.168.50.21', selected.endpoint, 403),
                     ({**headers, 'X-Forwarded-For': selected.forge_ip}, '192.168.50.21', selected.endpoint, 403),
                     ({**headers, 'X-Forwarded-For': '192.168.50.21'}, selected.forge_ip, selected.endpoint, 403),
                     ({**headers, 'Forwarded': 'for=' + selected.forge_ip}, selected.forge_ip, selected.endpoint, 403),
                     ({**headers, 'Host': 'other.test.invalid:9443'}, selected.forge_ip, selected.endpoint, 421),
                     ({**headers, 'Origin': 'https://backstory.test.invalid:9443'}, selected.forge_ip, selected.endpoint, 403),
                     ({**headers, 'Origin': 'https://evil.test.invalid'}, selected.forge_ip, selected.endpoint, 403),
                     (headers, selected.forge_ip, selected.endpoint.replace('https:', 'http:'), 403)]
            for supplied, peer, endpoint, expected in cases:
                transport = httpx2.ASGITransport(app=app, client=(peer, 54321))
                async with httpx2.AsyncClient(transport=transport) as http:
                    response = await http.post(endpoint, headers=supplied, json={})
                    assert response.status_code == expected
                    assert token not in response.text
                assert actor_count() == 0
                checks.append('request_refusal_before_access')

            transport = httpx2.ASGITransport(app=app, client=(selected.forge_ip, 54321))
            async with httpx2.AsyncClient(transport=transport, headers=headers) as http:
                oversized = await http.post(selected.endpoint, headers={'Content-Type': 'application/json', 'Content-Length': str(16 * 1024 * 1024 + 1)}, content=b'{}')
                assert oversized.status_code == 413 and actor_count() == 0
                checks.append('body_bound_before_access')
                # A stream that makes small progress must still have a total receive bound.
                import backstory.native_https as https_module
                async def slow_body():
                    for chunk in (b'{', b'}', b' '):
                        await asyncio.sleep(.012)
                        yield chunk
                with patch.object(https_module, 'BODY_TIMEOUT_SECONDS', .02, create=True):
                    timed = await http.post(selected.endpoint, headers={'Content-Type': 'application/json'}, content=slow_body())
                    assert timed.status_code == 408 and actor_count() == 0
                checks.append('absolute_receive_deadline_before_access')
                async with streamable_http_client(selected.endpoint, http_client=http) as streams:
                    async with ClientSession(*streams) as client:
                        negotiated = await client.initialize()
                        tools = await client.list_tools()
                        assert len(tools.tools) == 29
                        checks.append('sdk_initialize_discovery')

                        async def call(name, arguments):
                            result = await client.call_tool(name, arguments)
                            value = json.loads(result.content[0].text)
                            assert value['untrusted_content'] is True
                            return result, value

                        _, status = await call('wiki_status', {})
                        assert status['state'] in {'ok', 'partial'}
                        assert status['native_mcp']['transport'] == 'streamable_https'
                        assert actor_count() == 1
                        _, created = await call('create_note', {'path': 'proof.md', 'source': '# Private HTTPS proof\n'})
                        assert created['authoritative']
                        _, initial = await call('read_note', {'path': 'proof.md'})
                        _, listing = await call('list_notes', {'limit': 1})
                        assert listing['entries'][0]['path'] == 'proof.md'
                        _, batch = await call('read_notes', {'paths': ['proof.md', 'absent.md']})
                        assert [item['state'] for item in batch['results']] == ['ok', 'missing']
                        _, saved = await call('save_note', {'path': 'proof.md', 'source': '# Guarded replacement\n', 'revision': initial['revision']})
                        assert saved['authoritative']
                        after = (wiki / 'proof.md').read_bytes()
                        refused, conflict = await call('save_note', {'path': 'proof.md', 'source': '# Must not publish\n', 'revision': initial['revision']})
                        assert refused.is_error and conflict['state'] == 'conflict'
                        assert (wiki / 'proof.md').read_bytes() == after
                        _, current = await call('read_note', {'path': 'proof.md'})
                        assert current['revision'] == saved['revision']
                        _, denied = await call('read_note', {'path': '../outside.md'})
                        assert denied['state'] == 'error'
                        checks.extend(['status', 'bounded_reads', 'guarded_save_readback', 'stale_no_mutation', 'safe_path'])
                        # Delay only the acknowledgement of an actual guarded publication.
                        from wiki import native_service
                        original_dispatch = native_service._dispatch
                        with sqlite3.connect(data / 'backstory.sqlite3') as db:
                            revisions_before = db.execute('SELECT COUNT(*) FROM wiki_savedrevision').fetchone()[0]
                        entered, release = threading.Event(), threading.Event()
                        def delayed(access, name, arguments):
                            value = original_dispatch(access, name, arguments)
                            if name == 'save_note':
                                entered.set()
                                assert release.wait(5)
                            return value
                        with patch.object(native_service, '_dispatch', delayed):
                            pending = asyncio.create_task(client.call_tool('save_note', {'path': 'proof.md',
                                        'source': '# Acknowledgement lost\n', 'revision': current['revision']}))
                            try:
                                assert await asyncio.to_thread(entered.wait, 3)
                                overlap = await http.post(selected.endpoint, json={'jsonrpc': '2.0', 'id': 987,
                                                        'method': 'tools/list'})
                                assert overlap.status_code == 429 and overlap.json()['queued'] is False
                                pending.cancel()
                                try:
                                    await pending
                                except asyncio.CancelledError:
                                    pass
                                assert app.dispatcher.active
                            finally:
                                release.set()
                            for _ in range(200):
                                if not app.dispatcher.active and not app._request_active:
                                    break
                                await asyncio.sleep(.01)
                            else:
                                raise AssertionError('cancelled publication guard did not finish')
                        _, final = await call('read_note', {'path': 'proof.md'})
                        assert final['source'].endswith('# Acknowledgement lost\n') and final['authoritative']
                        with sqlite3.connect(data / 'backstory.sqlite3') as db:
                            assert db.execute('SELECT COUNT(*) FROM wiki_savedrevision').fetchone()[0] == revisions_before + 1
                        checks.extend(['http_overlap_not_queued', 'cancelled_ack_inspect_no_replay'])
                hermes_evidence = None
                if source := os.environ.get('BACKSTORY_TEST_HERMES_TOOLS'):
                    from tests.native.hermes_http_probe import exercise_shipped_helpers
                    hermes_evidence = await exercise_shipped_helpers(app, selected.endpoint, selected.forge_ip,
                                                                    token, scratch, source)
                    checks.extend(['hermes_header_interpolation', 'hermes_http_helper_sdk_initialize', 'hermes_redirect_boundary'])
                else:
                    import sys
                    assert 'tests.native.hermes_http_probe' not in sys.modules
        print(json.dumps({'proof': 'ASGI serialized HTTP plus production-context MemoryBIO TLS; no listener',
                          'checks': len(checks), 'sdk': '2.3.0', 'protocol': negotiated.protocol_version,
                          'tls': tls_version, 'scenarios': checks, 'hermes_source': hermes_evidence}))


if __name__ == '__main__':
    # The parent selected isolated roots before this process imports/setup Django.
    assert os.environ.get('BACKSTORY_HTTPS_PROOF_SCRATCH')
    import django
    django.setup()
    import sys
    assert 'backstory.native_https' not in sys.modules and 'mcp' not in sys.modules
    asyncio.run(proof())
