"""Explicit local stdio entry point. Never imported by web startup."""
import argparse
import asyncio
import os
from pathlib import Path

from .native_dispatch import action_error


def configure(argv=None):
    parser = argparse.ArgumentParser(description='Trusted local client access to the explicitly selected wiki and database.')
    parser.add_argument('--stdio', action='store_true', required=True)
    parser.add_argument('--wiki-root', type=Path, required=True)
    parser.add_argument('--data-dir', type=Path, required=True)
    args = parser.parse_args(argv)
    if not args.wiki_root.is_absolute() or not args.data_dir.is_absolute():
        parser.error('wiki-root and data-dir must be absolute')
    if not args.wiki_root.is_dir():
        parser.error('wiki-root must already exist; storage is never initialized here')
    os.environ.update(BACKSTORY_WIKI_ROOT=str(args.wiki_root), BACKSTORY_DATA_DIR=str(args.data_dir),
        DJANGO_SETTINGS_MODULE='backstory.settings', BACKSTORY_ALLOWED_HOSTS='localhost',
        BACKSTORY_COOKIE_MODE='localhost')


MAX_FRAME_CHARS = 16 * 1024 * 1024


class BoundedInput:
    """Bound a stdio JSON line before the official SDK parses it."""
    def __init__(self, stream):
        self.stream = stream

    def __aiter__(self):
        return self

    async def __anext__(self):
        import anyio
        line = await anyio.to_thread.run_sync(self.stream.readline, MAX_FRAME_CHARS + 1)
        if not line:
            raise StopAsyncIteration
        if len(line) > MAX_FRAME_CHARS or len(line.encode('utf-8')) > MAX_FRAME_CHARS:
            raise ValueError('native MCP frame exceeds 16 MiB')
        return line


async def serve():
    import sys
    from mcp.server.stdio import stdio_server
    from .native_dispatch import NativeDispatcher

    dispatcher = NativeDispatcher()
    await dispatcher.check_access()
    server = dispatcher.server()
    incoming = os.fdopen(os.dup(sys.stdin.fileno()), encoding='utf-8', errors='strict')
    try:
        async with stdio_server(stdin=BoundedInput(incoming)) as (read, write):
            await server.run(read, write, server.create_initialization_options())
    finally:
        incoming.close()


def main(argv=None):
    configure(argv)
    import django
    django.setup()
    asyncio.run(serve())


if __name__ == '__main__':
    main()
