"""Only the disposable browser fixture server uses request receipts."""
from pathlib import Path
import os
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
import django
django.setup()
from django.conf import settings
from django.core.management import execute_from_command_line
if os.environ.get('BACKSTORY_BROWSER_REQUEST_RECEIPTS'):
    settings.MIDDLEWARE = ['tests.browser.support.renderer_requests.RecordRequests', *settings.MIDDLEWARE]
execute_from_command_line(['manage.py', 'runserver', *sys.argv[1:]])
