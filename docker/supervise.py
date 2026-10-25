"""Fail the service when either child exits; reap and stop every sibling."""
import os
import signal
import subprocess
import sys
import time


def supervise(commands):
    children = []
    stopping = False
    def stop(signum, frame):
        nonlocal stopping
        stopping = True
    previous = {sig: signal.signal(sig, stop) for sig in (signal.SIGTERM, signal.SIGINT)}
    result = 0
    try:
        for command in commands:
            children.append(subprocess.Popen(command, start_new_session=True))
        while not stopping:
            for child in children:
                code = child.poll()
                if code is not None:
                    result = code if code > 0 else 1
                    # Even a clean unexpected child exit is a service failure.
                    result = result or 1
                    stopping = True
                    break
            if not stopping:
                time.sleep(.05)
    finally:
        for child in children:
            if child.poll() is None:
                os.killpg(child.pid, signal.SIGTERM)
        deadline = time.monotonic() + 5
        for child in children:
            try:
                child.wait(timeout=max(.01, deadline - time.monotonic()))
            except subprocess.TimeoutExpired:
                os.killpg(child.pid, signal.SIGKILL)
                child.wait()
        for sig, handler in previous.items():
            signal.signal(sig, handler)
    return result


def web_command():
    # Django alone applies the explicit TCP peer boundary. Disable Gunicorn's
    # independent scheme, identity/path forwarding and PROXY-protocol rewriting,
    # including values inherited through FORWARDED_ALLOW_IPS/GUNICORN_CMD_ARGS.
    return ['gunicorn', '--logger-class', 'backstory.logging.SafeGunicornLogger',
        '--no-control-socket', '--forwarded-allow-ips', '', '--forwarder-headers', '',
        '--proxy-protocol', 'off', 'backstory.wsgi:application', '--bind', '0.0.0.0:8000',
        '--workers', '1', '--threads', '4', '--timeout', '30', '--access-logfile', '/dev/null']


if __name__ == '__main__':
    sys.exit(supervise([
        web_command(),
        [sys.executable, 'manage.py', 'run_indexer'],
    ]))
