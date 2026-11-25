"""Shared schemas/results and one unqueued dispatcher for explicit native transports."""
import asyncio
import json
from pathlib import Path


_MUTATION_SUCCESS = {
    'preview_edit_note': {'preview'},
    'create_note': {'created', 'created_index_delayed'},
    'save_note': {'saved', 'saved_index_delayed', 'noop'},
    'edit_note': {'saved', 'saved_index_delayed', 'noop'},
    'create_folder': {'created', 'already_exists'},
    'preview_move': {'preview'}, 'commit_move': {'completed'}, 'rollback_move': {'cancelled'},
    'preview_removal': {'preview'}, 'commit_removal': {'removed'},
    'restore_removal': {'restored', 'cancelled'},
    'restore_note_revision': {'saved', 'saved_index_delayed', 'saved_source', 'saved_source_index_delayed', 'noop'},
    'upload_file': {'created', 'already_exists'},
}


def action_error(name, data):
    """Action success remains independent of certainty about published disk state."""
    if data.get('request_started') is False:
        return True
    if name in _MUTATION_SUCCESS:
        return data.get('state') not in _MUTATION_SUCCESS[name] or bool(data.get('reason_code'))
    return data.get('state') in {'error', 'unavailable'}


class NativeDispatcher:
    def __init__(self, *, transport='stdio'):
        from jsonschema import Draft202012Validator
        from mcp import types

        definitions = json.loads(Path(__file__).with_name('native_tools.json').read_text())
        self.schemas = {d['name']: Draft202012Validator(d['input_schema']) for d in definitions}
        self.tools = [types.Tool(name=d['name'], description=d['description'], input_schema=d['input_schema'],
                                annotations=types.ToolAnnotations(read_only_hint=not d['write'],
                                    destructive_hint=d['write'], idempotent_hint=False, open_world_hint=False))
                      for d in definitions]
        self.writes = {d['name'] for d in definitions if d['write']}
        self.access = None
        self.active = False
        self.transport = transport

    async def check_access(self):
        from asgiref.sync import sync_to_async
        from wiki.actors import local_access, require_actor

        if self.access is None:
            self.access = await sync_to_async(local_access, thread_sensitive=True)()
        await sync_to_async(require_actor, thread_sensitive=True)(self.access.actor)

    @staticmethod
    def reply(name, data):
        from django.core.serializers.json import DjangoJSONEncoder
        from mcp import types

        data = {'untrusted_content': True, **data}
        return types.CallToolResult(content=[types.TextContent(type='text', text=json.dumps(data, cls=DjangoJSONEncoder))],
                                    is_error=action_error(name, data))

    async def list_tools(self, ctx, params):
        from mcp import types
        return types.ListToolsResult(tools=self.tools)

    async def call_tool(self, ctx, params):
        from asgiref.sync import sync_to_async
        from wiki.native_service import invoke

        args = params.arguments or {}
        validator = self.schemas.get(params.name)
        if validator is None or not validator.is_valid(args):
            return self.reply(params.name, {'state': 'error', 'reason_code': 'invalid_arguments', 'request_started': False})
        if self.active:
            return self.reply(params.name, {'state': 'save_in_progress', 'request_started': False, 'queued': False})
        # Set before awaiting access/ORM work, so overlapping calls cannot queue.
        self.active = True

        async def execute():
            await self.check_access()
            data = await sync_to_async(invoke, thread_sensitive=True)(self.access, params.name, args,
                                                                      write=params.name in self.writes)
            if params.name == 'wiki_status' and 'native_mcp' in data:
                data['native_mcp']['transport'] = self.transport
            return data

        work = asyncio.create_task(execute())

        def finished(task):
            self.active = False
            if not task.cancelled():
                task.exception()  # retrieve errors even if the response recipient disappeared
        work.add_done_callback(finished)
        return self.reply(params.name, await asyncio.shield(work))

    def server(self):
        from mcp.server.lowlevel import Server
        return Server('Backstory local', version='1', on_list_tools=self.list_tools, on_call_tool=self.call_tool)
