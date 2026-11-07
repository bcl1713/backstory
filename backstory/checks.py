import ipaddress
import re
import sqlite3
from pathlib import PurePosixPath
from urllib.parse import urlsplit
from django.core.checks import Error, register


@register()
def sqlite_fts5(app_configs, **kwargs):
    try:
        with sqlite3.connect(":memory:") as connection:
            connection.execute("CREATE VIRTUAL TABLE fts_check USING fts5(content)")
    except sqlite3.DatabaseError:
        return [Error("SQLite FTS5 support is required", id="backstory.E001")]
    return []


def host_source_configuration_errors(mode, wiki_source, data_source):
    """Compare host provenance lexically; container realpath cannot resolve it.

    Provided host-bind manifests derive these values from their actual sources.
    Host symlink/bind aliases remain an operator-verified administrative boundary.
    """
    if mode == 'native':
        return [] if wiki_source is None and data_source is None else ['invalid_host_source_metadata']
    if mode != 'host-bind':
        return ['invalid_host_source_metadata']
    paths = []
    for source in (wiki_source, data_source):
        if (not isinstance(source, str) or not source.startswith('/') or source.startswith('//')
                or '\\' in source or any(ord(char) < 32 or ord(char) == 127 for char in source)):
            return ['invalid_host_source_metadata']
        path = PurePosixPath(source)
        # Reject alternate spellings rather than normalizing through unknown host
        # symlinks. Repeated separators, dot components and trailing slash fail.
        if '..' in path.parts or str(path) != source:
            return ['invalid_host_source_metadata']
        paths.append(path)
    wiki, data = paths
    if wiki.is_relative_to(data) or data.is_relative_to(wiki):
        return ['host_source_overlap']
    return []


def exact_host(host):
    """Django host allowlist entries: exact ASCII name or bracketed IPv6."""
    if not isinstance(host, str) or not host or len(host) > 253:
        return False
    if host.startswith('[') and host.endswith(']'):
        try:
            return '%' not in host and ipaddress.ip_address(host[1:-1]).version == 6
        except ValueError:
            return False
    return all(re.fullmatch(r'[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?', label)
               for label in host.split('.'))


def exact_https_origin(origin, hosts):
    try:
        parsed = urlsplit(origin)
        host = parsed.hostname
        allowed = host and (f'[{host}]' if ':' in host else host)
        return (origin.startswith('https://') and parsed.scheme == 'https'
                and not any(char.isspace() for char in origin)
                and not parsed.username and not parsed.password and '@' not in parsed.netloc
                and not parsed.path and not parsed.query and not parsed.fragment
                and '?' not in origin and '#' not in origin
                and (parsed.port is None or 1 <= parsed.port <= 65535)
                and not parsed.netloc.endswith(':')
                and exact_host(allowed) and allowed.lower() in {value.lower() for value in hosts})
    except (ValueError, TypeError):
        return False


def _browser_ipv6(address):
    # WHATWG serializes eight hexadecimal pieces, even for IPv4-mapped IPv6.
    # Python 3.13+ str/compressed may instead emit a dotted IPv4 suffix.
    packed = address.packed
    pieces = [int.from_bytes(packed[index:index + 2]) for index in range(0, 16, 2)]
    best_start, best_size, index = -1, 1, 0
    while index < 8:
        start = index
        while index < 8 and pieces[index] == 0:
            index += 1
        if index - start > best_size:
            best_start, best_size = start, index - start
        index += 1
    text = [format(piece, 'x') for piece in pieces]
    if best_start >= 0:
        return ':'.join(text[:best_start]) + '::' + ':'.join(text[best_start + best_size:])
    return ':'.join(text)


def exact_renderer_origin(origin, hosts, cookie_mode):
    """One canonical browser origin; never derive embedding authority from CSRF."""
    if not isinstance(origin, str) or not origin or not origin.isascii():
        return False
    try:
        parsed = urlsplit(origin)
        host = parsed.hostname
        authority = f'[{host}]' if host and ':' in host else host
        if (not authority or not exact_host(authority) or authority not in hosts
                or any(c.isspace() or ord(c) < 32 for c in origin)
                or parsed.username is not None or parsed.password is not None
                or parsed.path or parsed.query or parsed.fragment):
            return False
        # Browser special-scheme URLs normalize legacy IPv4 spellings and
        # compress IPv6. Reject rather than silently broaden host authority.
        # WHATWG URL: host parsing / ends-in-a-number / host serialization.
        if ':' in host:
            if host != _browser_ipv6(ipaddress.IPv6Address(host)):
                return False
        elif re.fullmatch(r'(?:[0-9]+|0[xX][0-9a-fA-F]*)', host.rsplit('.', 1)[-1]):
            # Numeric-ending DNS names are interpreted as IPv4 by browsers too.
            # IPv4Address accepts only four canonical decimal octets, rejecting
            # shortened/integer/hex/octal/malformed numeric forms.
            if host != str(ipaddress.IPv4Address(host)):
                return False
        if cookie_mode == 'localhost':
            if parsed.scheme != 'http' or authority not in {'localhost', '127.0.0.1', '[::1]'}:
                return False
            if parsed.port is None or parsed.port == 80:
                return False
        elif cookie_mode != 'https' or parsed.scheme != 'https' or parsed.port == 443:
            return False
        if parsed.port is not None and not 1 <= parsed.port <= 65535:
            return False
        canonical = f'{parsed.scheme}://{authority}' + (f':{parsed.port}' if parsed.port else '')
        return origin == canonical
    except (TypeError, ValueError):
        return False


def safe_origin_bind(address, cookie_mode):
    try:
        if not isinstance(address, str) or '%' in address:
            return False
        parsed = ipaddress.ip_address(address)
        return cookie_mode in {'localhost', 'https'} and (cookie_mode == 'https' or parsed.is_loopback)
    except ValueError:
        return False


def proxy_configuration_errors(mode, cookie_mode, hosts, origins, peers, client_header):
    """Shared startup/check validation. Diagnostics never include configured values."""
    errors = []
    if mode not in {'off', 'trusted'}:
        errors.append('invalid_proxy_mode')
    if client_header not in {'none', 'x-forwarded-for', 'x-real-ip'}:
        errors.append('invalid_proxy_client_header')
    try:
        if any(not isinstance(peer, str) or '%' in peer for peer in peers):
            raise ValueError
        networks = [ipaddress.ip_network(peer) for peer in peers]
        # Reject universal trust even when split across multiple CIDRs.
        collapsed = [network for version in (4, 6) for network in
                     ipaddress.collapse_addresses(n for n in networks if n.version == version)]
        if any(n.prefixlen == 0 or n.is_multicast or
               (n.num_addresses == 1 and n.network_address.is_unspecified) for n in collapsed):
            raise ValueError
    except (ValueError, TypeError):
        errors.append('invalid_proxy_peers')
    if mode == 'trusted':
        if not peers:
            errors.append('missing_proxy_peers')
        if cookie_mode != 'https':
            errors.append('proxy_requires_https')
        if not hosts or not all(exact_host(host) for host in hosts):
            errors.append('invalid_proxy_hosts')
        if not origins or not all(exact_https_origin(origin, hosts) for origin in origins):
            errors.append('invalid_proxy_origins')
    return errors


@register()
def deployment_security(app_configs, **kwargs):
    from django.conf import settings
    unsafe = bool(proxy_configuration_errors(
        settings.BACKSTORY_PROXY_MODE, settings.BACKSTORY_COOKIE_MODE,
        settings.ALLOWED_HOSTS, settings.CSRF_TRUSTED_ORIGINS,
        settings.BACKSTORY_TRUSTED_PROXY_IPS, settings.BACKSTORY_PROXY_CLIENT_IP_HEADER))
    unsafe |= not safe_origin_bind(settings.BACKSTORY_BIND_ADDRESS, settings.BACKSTORY_COOKIE_MODE)
    unsafe |= settings.SECURE_PROXY_SSL_HEADER is not None or settings.USE_X_FORWARDED_HOST or settings.USE_X_FORWARDED_PORT
    if settings.BACKSTORY_PROXY_MODE == 'trusted':
        try:
            response = settings.MIDDLEWARE.index('backstory.middleware.ResponsePolicyMiddleware')
            guard = settings.MIDDLEWARE.index('backstory.middleware.TrustedProxyMiddleware')
            security = settings.MIDDLEWARE.index('django.middleware.security.SecurityMiddleware')
            unsafe |= not (response == 0 and guard == 1 and guard < security)
        except ValueError:
            unsafe = True
    if settings.BACKSTORY_COOKIE_MODE != 'localhost':
        unsafe |= (not settings.SESSION_COOKIE_SECURE or not settings.CSRF_COOKIE_SECURE
            or not settings.SESSION_COOKIE_HTTPONLY or not settings.CSRF_COOKIE_HTTPONLY
            or settings.SESSION_COOKIE_SAMESITE != 'Lax' or settings.CSRF_COOKIE_SAMESITE != 'Lax'
            or not settings.SECURE_SSL_REDIRECT or not settings.ALLOWED_HOSTS
            or not all(exact_host(host) for host in settings.ALLOWED_HOSTS)
            or not all(exact_https_origin(origin, settings.ALLOWED_HOSTS) for origin in settings.CSRF_TRUSTED_ORIGINS))
    errors = [Error('Insecure production cookie/host/origin/proxy configuration', id='backstory.E002')] if unsafe else []
    if host_source_configuration_errors(settings.BACKSTORY_STORAGE_SOURCE_MODE,
            settings.BACKSTORY_WIKI_HOST_SOURCE, settings.BACKSTORY_DATA_HOST_SOURCE):
        errors.append(Error('Invalid or overlapping host storage source configuration', id='backstory.E003'))
    return errors
