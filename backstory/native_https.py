"""Explicit authenticated private HTTPS MCP process. Never imported by web startup."""
import argparse
from contextlib import asynccontextmanager
from dataclasses import dataclass
import hashlib
import hmac
import ipaddress
import os
from pathlib import Path
import re
import ssl
import stat
from urllib.parse import urlsplit

MAX_REQUEST_BYTES = 16 * 1024 * 1024
MAX_RESPONSE_BYTES = 32 * 1024 * 1024
BODY_TIMEOUT_SECONDS = 10
_PRIVATE = tuple(ipaddress.ip_network(value) for value in ('10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'))
_TOKEN = re.compile(rb'[A-Za-z0-9._~+/-]{32,256}=*\Z')


class _ReceiveTimeout(Exception):
    pass


def _private_ip(value):
    address = ipaddress.IPv4Address(value)
    if not any(address in network for network in _PRIVATE):
        raise ValueError('a specific RFC1918 IPv4 address is required')
    if str(address) != value:
        raise ValueError('address must be canonical')
    return address


def _private_lan(value):
    network = ipaddress.IPv4Network(value, strict=True)
    if (str(network) != value or not any(network.subnet_of(private) for private in _PRIVATE)):
        raise ValueError('an exact canonical CIDR wholly within RFC1918 is required')
    return network


@dataclass(frozen=True)
class HttpsSettings:
    wiki_root: Path
    data_dir: Path
    bind_ip: str
    port: int
    endpoint: str
    forge_ip: str | None
    token_file: Path
    cert_file: Path
    key_file: Path
    lan_cidr: str | None = None

    def validate(self):
        _private_ip(self.bind_ip)
        if (self.forge_ip is None) == (self.lan_cidr is None):
            raise ValueError('select exactly one Forge peer or explicit LAN CIDR')
        if self.lan_cidr is not None:
            if ipaddress.IPv4Address(self.bind_ip) not in _private_lan(self.lan_cidr):
                raise ValueError('bind address must lie within the configured LAN')
        else:
            _private_ip(self.forge_ip)
            if self.bind_ip == self.forge_ip:
                raise ValueError('Forge source must differ from the listener address')
        if type(self.port) is not int or not 1 <= self.port <= 65535:
            raise ValueError('an exact port is required')
        url = urlsplit(self.endpoint)
        host = url.hostname or ''
        if (url.scheme != 'https' or url.path != '/mcp' or url.query or url.fragment
                or url.username is not None or url.password is not None
                or not re.fullmatch(r'[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?', host)
                or '..' in host or url.netloc != f'{host}:{self.port}' or url.port != self.port):
            raise ValueError('endpoint must be canonical https://exact-host:port/mcp without userinfo/query/fragment')
        try:
            address = ipaddress.ip_address(host)
        except ValueError:
            pass  # exact operator-supplied DNS name; no DNS lookup at configuration time
        else:
            if str(address) != self.bind_ip:
                raise ValueError('literal endpoint address must equal bind address')
        paths = (self.wiki_root, self.data_dir, self.token_file, self.cert_file, self.key_file)
        if not all(path.is_absolute() for path in paths):
            raise ValueError('all paths must be explicit and absolute')
        if not self.wiki_root.is_dir() or not (self.data_dir / 'backstory.sqlite3').is_file():
            raise ValueError('select an existing wiki and migrated application database')
        wiki, data = self.wiki_root.resolve(), self.data_dir.resolve()
        if wiki.is_relative_to(data) or data.is_relative_to(wiki):
            raise ValueError('wiki and application data must be disjoint')
        return self


    def allows_peer(self, value):
        if not isinstance(value, str):
            return False
        if self.forge_ip is not None:
            return value == self.forge_ip
        try:
            peer = ipaddress.IPv4Address(value)
        except ValueError:
            return False
        return str(peer) == value and peer in _private_lan(self.lan_cidr)


def parse_settings(argv=None):
    parser = argparse.ArgumentParser(description='Opt-in authenticated private HTTPS MCP; explicit LAN or Forge peer, no anonymous/proxy mode.')
    parser.add_argument('--https', action='store_true', required=True)
    for flag in ('wiki-root', 'data-dir', 'token-file', 'tls-cert', 'tls-key'):
        parser.add_argument('--' + flag, type=Path, required=True)
    for flag in ('bind-ip', 'endpoint'):
        parser.add_argument('--' + flag, required=True)
    peers = parser.add_mutually_exclusive_group(required=True)
    peers.add_argument('--forge-ip')
    peers.add_argument('--lan-cidr')
    parser.add_argument('--port', type=int, required=True)
    args = parser.parse_args(argv)
    try:
        return HttpsSettings(args.wiki_root, args.data_dir, args.bind_ip, args.port, args.endpoint,
                             args.forge_ip, args.token_file, args.tls_cert, args.tls_key, lan_cidr=args.lan_cidr).validate()
    except (ValueError, OSError):
        parser.error('invalid explicit private HTTPS configuration; check paths, private addresses and exact endpoint')


def _private_file(path, maximum):
    """No-follow bounded owner-private regular files; never include their bytes in errors."""
    try:
        fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK | os.O_CLOEXEC)
        with os.fdopen(fd, 'rb') as stream:
            info = os.fstat(stream.fileno())
            if (not stat.S_ISREG(info.st_mode) or info.st_uid != os.geteuid()
                    or info.st_mode & 0o077 or not 0 < info.st_size <= maximum):
                raise ValueError
            data = stream.read(maximum + 1)
            if len(data) > maximum:
                raise ValueError
            return data
    except (OSError, ValueError):
        raise ValueError('required private file is unreadable, unsafe or oversized') from None


def token_digest(path):
    raw = _private_file(path, 257)
    if raw.endswith(b'\n'):
        raw = raw[:-1]
    if not 32 <= len(raw) <= 256 or not _TOKEN.fullmatch(raw):
        raise ValueError('private bearer file must contain one bounded ASCII token')
    return hashlib.sha256(raw).digest()


def tls_context(settings):
    _private_file(settings.key_file, 64 * 1024)
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    context.load_cert_chain(settings.cert_file, settings.key_file)
    context.set_alpn_protocols(['http/1.1'])
    return context


class PrivateHttpsApp:
    def __init__(self, settings):
        from mcp.server.transport_security import RequestBodyLimitMiddleware, TransportSecuritySettings, TransportSecurityMiddleware
        from .native_dispatch import NativeDispatcher

        self.settings = settings.validate()
        self._credential_digest = token_digest(settings.token_file)
        self.dispatcher = NativeDispatcher(transport='streamable_https')
        self._request_active = False
        self.security_settings = TransportSecuritySettings(enable_dns_rebinding_protection=True,
                            allowed_hosts=[urlsplit(settings.endpoint).netloc], allowed_origins=[])
        self.security = TransportSecurityMiddleware(self.security_settings)
        self.sdk = self.dispatcher.server().streamable_http_app(json_response=True, stateless_http=True,
                    streamable_http_path='/mcp', transport_security=self.security_settings,
                    host=settings.bind_ip, max_request_body_size=MAX_REQUEST_BYTES)
        self._bounded = RequestBodyLimitMiddleware(self._authorized, MAX_REQUEST_BYTES)

    @asynccontextmanager
    async def lifespan(self):
        async with self.sdk.router.lifespan_context(self.sdk):
            yield

    @staticmethod
    async def _reject(scope, receive, send, status, reason, *, uncertain=False):
        from starlette.responses import JSONResponse
        data = {'state': 'uncertain' if uncertain else 'error', 'reason_code': reason,
                'request_started': uncertain, 'queued': False, 'untrusted_content': True}
        if uncertain:
            data.update(authoritative=False, read_before_retry=True, inspect_before_retry=True)
        headers = {'Cache-Control': 'no-store'}
        if status == 401:
            headers['WWW-Authenticate'] = 'Bearer realm="Backstory private MCP"'
        await JSONResponse(data, status_code=status, headers=headers)(scope, receive, send)

    async def _authorized(self, scope, receive, send):
        # Body limits, peer/auth and header security already passed. No access
        # resolution is allowed to queue behind a synchronous mutation.
        await self.dispatcher.check_access()
        await self.sdk(scope, receive, send)

    async def __call__(self, scope, receive, send):
        import asyncio
        from starlette.requests import Request

        if scope['type'] == 'lifespan':
            return await self.sdk(scope, receive, send)
        if scope['type'] != 'http':
            return
        peer = scope.get('client')
        if scope.get('scheme') != 'https' or not peer or not self.settings.allows_peer(peer[0]):
            return await self._reject(scope, receive, send, 403, 'peer_or_tls_denied')
        pairs = scope.get('headers', [])
        if any(key == b'forwarded' or key == b'x-real-ip' or key.startswith(b'x-forwarded-') for key, _ in pairs):
            return await self._reject(scope, receive, send, 403, 'forwarded_peer_denied')
        credentials = [value for key, value in pairs if key == b'authorization']
        valid = (len(credentials) == 1 and credentials[0].startswith(b'Bearer ')
                 and len(credentials[0]) <= 264
                 and hmac.compare_digest(hashlib.sha256(credentials[0][7:]).digest(), self._credential_digest))
        if not valid:
            return await self._reject(scope, receive, send, 401, 'authentication_required')
        hosts = [value for key, value in pairs if key == b'host']
        if hosts != [urlsplit(self.settings.endpoint).netloc.encode('ascii')]:
            return await self._reject(scope, receive, send, 421, 'host_denied')
        if any(key == b'origin' for key, _ in pairs):
            return await self._reject(scope, receive, send, 403, 'origin_denied')
        denial = await self.security.validate_request(Request(scope), is_post=scope['method'] == 'POST')
        if denial is not None:
            return await denial(scope, receive, send)
        if scope['path'] != '/mcp' or scope.get('query_string'):
            return await self._reject(scope, receive, send, 404, 'endpoint_not_found')
        if scope['method'] != 'POST':
            return await self._reject(scope, receive, send, 405, 'method_not_allowed')
        if self._request_active or self.dispatcher.active:
            return await self._reject(scope, receive, send, 429, 'save_in_progress')
        self._request_active = True
        buffered, size = [], 0
        deadline = asyncio.get_running_loop().time() + BODY_TIMEOUT_SECONDS
        body_complete = False

        async def bounded_receive():
            nonlocal body_complete
            if body_complete:
                return await receive()
            remaining = deadline - asyncio.get_running_loop().time()
            if remaining <= 0:
                raise _ReceiveTimeout
            try:
                message = await asyncio.wait_for(receive(), timeout=remaining)
            except asyncio.TimeoutError:
                raise _ReceiveTimeout from None
            if message['type'] == 'http.request' and not message.get('more_body', False):
                body_complete = True
            return message

        async def bounded_send(message):
            nonlocal size
            size += len(message.get('body', b''))
            if size > MAX_RESPONSE_BYTES:
                raise ValueError('response_limit')
            buffered.append(message)

        try:
            await self._bounded(scope, bounded_receive, bounded_send)
        except _ReceiveTimeout:
            return await self._reject(scope, receive, send, 408, 'receive_timeout')
        except Exception:
            # No exception text, credentials or note data crosses this boundary.
            # Publication may already have occurred: inspect, never replay.
            return await self._reject(scope, receive, send, 503, 'outcome_unconfirmed', uncertain=True)
        finally:
            self._request_active = False
        for message in buffered:
            if message['type'] == 'http.response.start':
                message['headers'] = [*message.get('headers', []), (b'cache-control', b'no-store')]
            await send(message)


def create_app(settings):
    return PrivateHttpsApp(settings)


def server_config(app, settings):
    import uvicorn
    settings.validate()
    context = tls_context(settings)
    return uvicorn.Config(app, host=settings.bind_ip, port=settings.port,
                          ssl_context_factory=lambda config, default: context,
                          proxy_headers=False, forwarded_allow_ips='', access_log=False,
                          ws='none', workers=1, limit_concurrency=8, backlog=8,
                          timeout_keep_alive=5, timeout_graceful_shutdown=30, log_level='warning')


def main(argv=None):
    settings = parse_settings(argv)
    # Select storage before importing/setup Django; never read saved client config.
    os.environ.update(BACKSTORY_WIKI_ROOT=str(settings.wiki_root), BACKSTORY_DATA_DIR=str(settings.data_dir),
                      DJANGO_SETTINGS_MODULE='backstory.settings', BACKSTORY_ALLOWED_HOSTS='localhost',
                      BACKSTORY_COOKIE_MODE='localhost')
    import django
    django.setup()
    import uvicorn
    uvicorn.Server(server_config(create_app(settings), settings)).run()


if __name__ == '__main__':
    main()
