import ipaddress
import re
import sqlite3
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
    return [Error('Insecure production cookie/host/origin/proxy configuration', id='backstory.E002')] if unsafe else []
