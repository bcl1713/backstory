"""Bounded formatter timing evidence. Never retain source, paths or raw stderr."""
import json
import logging
import os
import re

logger = logging.getLogger('backstory.format')
STAGES = frozenset({'input', 'worker_start', 'module_import', 'configuration',
                    'source_math', 'source_diagrams', 'candidate_math',
                    'candidate_diagrams', 'worker_timeout', 'cleanup', 'output'} | {
    f'pass{n}_{step}' for n in (1, 2) for step in
    ('wikilinks', 'prettier', 'lint_fix', 'wikilinks_check', 'prettier_check', 'lint_check')})


def bounded_int(value, maximum):
    return value if type(value) is int and 0 <= value <= maximum else None


def safe_event(source):
    source = source if isinstance(source, dict) else {}
    trace = source.get('trace')
    safe_trace = []
    for item in trace[:64] if isinstance(trace, list) else []:
        if not isinstance(item, dict):
            continue
        stage, elapsed = item.get('stage'), bounded_int(item.get('elapsed_ms'), 60000)
        if isinstance(stage, str) and stage in STAGES and elapsed is not None:
            safe_trace.append(dict(stage=stage, elapsed_ms=elapsed))
    revision, version = source.get('revision'), source.get('version')
    return dict(source_bytes=bounded_int(source.get('source_bytes'), 2 * 1024 * 1024),
                elapsed_ms=bounded_int(source.get('elapsed_ms'), 60000),
                outcome=source.get('outcome') if source.get('outcome') in ('ok', 'skipped', 'failed') else 'failed',
                timeout_origin=source.get('timeout_origin') if source.get('timeout_origin') in ('python', 'node', 'none') else 'none',
                revision=revision if isinstance(revision, str) and re.fullmatch(r'[0-9a-f]{40}', revision) else 'unknown',
                version=version if isinstance(version, str) and len(version) <= 80 and re.fullmatch(r'\d+\.\d+\.\d+(?:-dev\.\d+\.g[0-9a-f]{12})?', version) else 'unknown',
                trace=safe_trace)


class RedactFormatDiagnostic(logging.Filter):
    def filter(self, record):
        event = safe_event(getattr(record, 'format_event', None))
        record.msg = json.dumps(event, sort_keys=True)
        record.args = ()
        record.exc_info = record.exc_text = record.stack_info = None
        record.format_event = event
        for key in ('request', 'status_code'):
            record.__dict__.pop(key, None)
        return True


class Progress:
    """Accept at most 16 KiB of stderr and 64 fixed-schema progress markers."""
    def __init__(self):
        self.trace = []
        self.pending = b''
        self.remaining = 16384

    def feed(self, chunk):
        # Oversized/truncated lines never become trusted evidence. Still drain
        # the pipe after the cap so logging cannot block a successful helper.
        data = self.pending + chunk[:self.remaining]
        self.remaining = max(0, self.remaining - len(chunk))
        lines = data.split(b'\n')
        self.pending = lines.pop() if self.remaining else b''
        for line in lines:
            if len(self.trace) >= 64 or len(line) > 256 or not line.startswith(b'backstory-format:'):
                continue
            try:
                item = json.loads(line[len(b'backstory-format:'):])
            except (ValueError, UnicodeError, RecursionError):
                continue
            clean = safe_event({'trace': [item]})['trace']
            if clean and (not self.trace or clean[0]['elapsed_ms'] >= self.trace[-1]['elapsed_ms']):
                self.trace.extend(clean)


def record(source_bytes, elapsed_ms, outcome, timeout_origin, trace):
    event = safe_event(dict(source_bytes=source_bytes, elapsed_ms=elapsed_ms,
                           outcome=outcome, timeout_origin=timeout_origin, trace=trace,
                           revision=os.environ.get('BACKSTORY_BUILD_REVISION'),
                           version=os.environ.get('BACKSTORY_BUILD_VERSION')))
    try:
        logger.info('formatter_event', extra={'format_event': event})
    except Exception:
        # Evidence sink failure must never turn a completed save into failure.
        pass
