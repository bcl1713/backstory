"""Synthetic browser-server URL receipts; never installed in application settings."""
import json
import os
from pathlib import Path


class RecordRequests:
    def __init__(self, get_response):
        self.get_response = get_response
        self.path = Path(os.environ['BACKSTORY_BROWSER_REQUEST_RECEIPTS'])

    def __call__(self, request):
        # No cookies, headers, body, username, or real wiki is recorded.
        with self.path.open('a') as stream:
            stream.write(json.dumps({'method': request.method, 'path': request.get_full_path()}) + '\n')
        return self.get_response(request)
