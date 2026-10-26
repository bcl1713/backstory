"""Small environment parsers with operator-facing, value-free diagnostics."""
import math
import os

from django.core.exceptions import ImproperlyConfigured


def positive_integer(name, default):
    try:
        value = int(os.environ.get(name, str(default)))
        if value > 0:
            return value
    except ValueError:
        pass
    raise ImproperlyConfigured(f"{name} must be a positive integer; omit it to use {default}") from None


def positive_seconds(name, default):
    try:
        value = float(os.environ.get(name, str(default)))
        if math.isfinite(value) and value >= 1:
            return value
    except ValueError:
        pass
    raise ImproperlyConfigured(
        f"{name} must be finite seconds >= 1; omit it to use {default}") from None


PROXY_REMEDIES = {
    'invalid_proxy_mode': 'BACKSTORY_PROXY_MODE must be off or trusted',
    'invalid_proxy_client_header': 'BACKSTORY_PROXY_CLIENT_IP_HEADER must be none, x-real-ip or x-forwarded-for',
    'invalid_proxy_peers': 'BACKSTORY_TRUSTED_PROXY_IPS must contain literal IPs or canonical narrow CIDRs, never universal trust',
    'missing_proxy_peers': 'BACKSTORY_TRUSTED_PROXY_IPS must name the actual trusted TCP peers in trusted mode',
    'proxy_requires_https': 'BACKSTORY_COOKIE_MODE must be https in trusted proxy mode',
    'invalid_proxy_hosts': 'BACKSTORY_ALLOWED_HOSTS must contain exact hostnames or IPs without schemes, ports or wildcards',
    'invalid_proxy_origins': 'BACKSTORY_CSRF_TRUSTED_ORIGINS must contain exact HTTPS origins matching BACKSTORY_ALLOWED_HOSTS in trusted mode',
}
