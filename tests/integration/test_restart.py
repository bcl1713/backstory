"""Independent interpreters exercise persisted state, never a private wiki."""
import json
import os
from pathlib import Path
import subprocess
import sys

from tests.fixtures.generate import generate_fixture


def run(program, env):
    result = subprocess.run([sys.executable, '-c', program], env=env, capture_output=True, text=True, timeout=120)
    assert result.returncode == 0, result.stderr
    return result.stdout


def environment(fixture):
    return {**os.environ, 'DJANGO_SETTINGS_MODULE': 'backstory.settings',
        'BACKSTORY_WIKI_ROOT': str(fixture.wiki_root), 'BACKSTORY_DATA_DIR': str(fixture.data_dir),
        'BACKSTORY_IDENTITY_PATH': fixture.identity_path,
        'BACKSTORY_COOKIE_MODE': 'localhost', 'BACKSTORY_ALLOWED_HOSTS': 'localhost,testserver'}


SEED = '''import django,json,os; django.setup()
from pathlib import Path
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone
from datetime import timedelta
from accounts.models import SessionDevice
from wiki.models import SavedRevision,RecoveryDraft
from wiki.revisions import store_draft
from indexing.queue import request_scan
from indexing.worker import run_batch
from indexing.models import ScanState,IndexGeneration
u=get_user_model().objects.create_user('human',password='synthetic-restart-password')
a=get_user_model().objects.create_user('assistant',password='synthetic-restart-password')
c=Client(); assert c.post('/accounts/login/',{'username':'human','password':'synthetic-restart-password'}).status_code==302
e=Client(); assert e.post('/accounts/login/',{'username':'human','password':'synthetic-restart-password'}).status_code==302
SessionDevice.objects.filter(session_key_digest=__import__('accounts.sessions',fromlist=['digest']).digest(e.session.session_key)).update(last_seen_at=timezone.now()-timedelta(hours=13))
note=settings.BACKSTORY_WIKI_ROOT/'notes/Recovery.md'; note.write_bytes(b'\\xef\\xbb\\xbf# Original\\r\\n')
base=c.get('/notes/notes/Recovery.md')['ETag']
r=c.post('/save/notes/Recovery.md',data=json.dumps({'source':'# Changed\\r\\n'}),content_type='application/json',HTTP_IF_MATCH=base); assert r.status_code==200
store_draft(u,'notes/Recovery.md',base,'# Protected draft\\r\\n',[],base_source='# Original\\r\\n',bom=True,newline='\\r\\n')
request_scan('rebuild')
for n in range(100):
 r=run_batch(now=10000000000+n*400)
 if not r.pending: break
assert IndexGeneration.objects.filter(state='active').exists()
request_scan('rebuild'); run_batch(now=10000050000)
checkpoint=ScanState.objects.get().checkpoint
assert checkpoint
state={'session':c.session.session_key,'expired':e.session.session_key,'checkpoint':checkpoint,'active':list(IndexGeneration.objects.filter(state='active').values_list('pk',flat=True))}
fd=os.open(settings.BACKSTORY_DATA_DIR/'test-state.json',os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
with os.fdopen(fd,'w') as stream: json.dump(state,stream)
'''

VERIFY = '''import django,json; django.setup()
from django.conf import settings
from django.test import Client
from django.contrib.auth import get_user_model
from wiki.models import SavedRevision,RecoveryDraft
from indexing.models import ScanState,IndexGeneration
state=json.loads((settings.BACKSTORY_DATA_DIR/'test-state.json').read_text())
assert get_user_model().objects.count()==2
assert SavedRevision.objects.count()==1 and RecoveryDraft.objects.count()==1
assert bytes(RecoveryDraft.objects.get().source)==b'# Protected draft\\r\\n'
assert ScanState.objects.get().checkpoint==state['checkpoint']
assert list(IndexGeneration.objects.filter(state='active').values_list('pk',flat=True))==state['active']
c=Client(); c.cookies['sessionid']=state['session']; assert c.get('/notes/notes/Recovery.md').status_code==200
expired=Client(); expired.cookies['sessionid']=state['expired']; assert expired.get('/notes/notes/Recovery.md').status_code==302
from indexing.worker import run_batch
for n in range(100):
 r=run_batch(now=10000050000+n*400)
 if not r.pending: break
assert get_user_model().objects.count()==2
assert c.get('/notes/notes/Recovery.md').status_code==200
assert SavedRevision.objects.count()==1 and RecoveryDraft.objects.count()==1
'''


def seed(tmp_path):
    fixture = generate_fixture(tmp_path / 'fixture', 'small')
    env = environment(fixture)
    subprocess.run([sys.executable, 'manage.py', 'migrate', '--noinput'], env=env, capture_output=True, check=True, timeout=30)
    run(SEED, env)
    return fixture, env


def test_restart_preserves_secret_sessions_index_checkpoint_and_recovery(tmp_path):
    fixture, env = seed(tmp_path)
    secret = (fixture.data_dir / 'application-secret').read_bytes()
    run(VERIFY, env)
    assert (fixture.data_dir / 'application-secret').read_bytes() == secret
    # Unavailable storage after restart still permits login/status/recovery and
    # retains the last useful index; no replacement root or auto-save.
    identity = fixture.wiki_root / fixture.identity_path
    identity.unlink()
    run('''import django,json; django.setup()
from django.conf import settings
from django.test import Client
s=json.loads((settings.BACKSTORY_DATA_DIR/'test-state.json').read_text())
c=Client(); c.cookies['sessionid']=s['session']
assert c.get('/status/').status_code==200
assert c.get('/drafts/').status_code==200
assert c.get('/notes/notes/Recovery.md').status_code==503
from indexing.models import IndexGeneration
assert IndexGeneration.objects.filter(state='active').exists()
''', env)
    assert fixture.wiki_root.exists() and not identity.exists()
