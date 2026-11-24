"""Explicit local stdio entry point. Never imported by web startup."""
import argparse
import asyncio
import json
import os
from pathlib import Path


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


_MUTATION_SUCCESS = {
    'create_note': {'created', 'created_index_delayed'},
    'save_note': {'saved', 'saved_index_delayed', 'noop'},
    'create_folder': {'created', 'already_exists'},
    'preview_move': {'preview'}, 'commit_move': {'completed'}, 'rollback_move': {'cancelled'},
    'preview_removal': {'preview'}, 'commit_removal': {'removed'},
    'restore_removal': {'restored', 'cancelled'},
    'restore_note_revision': {'saved', 'saved_index_delayed', 'saved_source', 'saved_source_index_delayed', 'noop'},
    'upload_file': {'created', 'already_exists'},
}


def action_error(name, data):
    """MCP action success is separate from certainty about published disk state."""
    if data.get('request_started') is False:
        return True
    if name in _MUTATION_SUCCESS:
        return data.get('state') not in _MUTATION_SUCCESS[name] or bool(data.get('reason_code'))
    return data.get('state') in {'error', 'unavailable'}


async def serve():
    import sys
    from asgiref.sync import sync_to_async
    from django.core.serializers.json import DjangoJSONEncoder
    from jsonschema import Draft202012Validator
    from mcp import types
    from mcp.server.lowlevel import Server
    from mcp.server.stdio import stdio_server
    from wiki.actors import local_access
    from wiki.native_service import invoke

    access = await sync_to_async(local_access, thread_sensitive=True)()
    definitions = json.loads(Path(__file__).with_name('native_tools.json').read_text())
    schemas = {d['name']: Draft202012Validator(d['input_schema']) for d in definitions}
    tools = [types.Tool(name=d['name'], description=d['description'], input_schema=d['input_schema'],
                        annotations=types.ToolAnnotations(read_only_hint=not d['write'],
                            destructive_hint=d['write'], idempotent_hint=False, open_world_hint=False)) for d in definitions]
    writes = {d['name'] for d in definitions if d['write']}
    active = False

    def reply(name, data):
        data = {'untrusted_content': True, **data}
        # JSON text is the stable cross-version tool result contract.
        return types.CallToolResult(content=[types.TextContent(type='text', text=json.dumps(data, cls=DjangoJSONEncoder))],
                                    is_error=action_error(name, data))

    async def list_tools(ctx, params):
        return types.ListToolsResult(tools=tools)

    async def call_tool(ctx, params):
        nonlocal active
        args = params.arguments or {}
        validator = schemas.get(params.name)
        if validator is None or not validator.is_valid(args):
            return reply(params.name, {'state': 'error', 'reason_code': 'invalid_arguments', 'request_started': False})
        if active:
            return reply(params.name, {'state': 'save_in_progress', 'request_started': False, 'queued': False})
        active = True
        work = asyncio.create_task(sync_to_async(invoke, thread_sensitive=True)(access, params.name, args, write=params.name in writes))

        def finished(task):
            nonlocal active
            active = False
        work.add_done_callback(finished)
        # Client cancellation cannot release the guard while synchronous storage
        # work is still running. Nothing is queued or replayed after completion.
        return reply(params.name, await asyncio.shield(work))

    server = Server('Backstory local', version='1', on_list_tools=list_tools, on_call_tool=call_tool)
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
