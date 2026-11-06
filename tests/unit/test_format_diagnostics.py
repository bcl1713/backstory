import json
import logging


def test_log_filter_rejects_untrusted_fields_and_exception_details():
    from wiki.format_diagnostics import RedactFormatDiagnostic
    record = logging.LogRecord('backstory.format', logging.ERROR, 'private-path', 1,
                               'private source %s', ('secret',), (ValueError, ValueError('private'), None))
    record.format_event = {'source_bytes': 12, 'elapsed_ms': 23, 'outcome': 'ok',
                           'timeout_origin': 'node', 'revision': 'private', 'version': 'secret/path',
                           'trace': [{'stage': 'module_import', 'elapsed_ms': 2},
                                     {'stage': 'private-name.md', 'elapsed_ms': 3}], 'body': 'secret'}
    assert RedactFormatDiagnostic().filter(record)
    event = json.loads(record.getMessage())
    assert event == {'source_bytes': 12, 'elapsed_ms': 23, 'outcome': 'ok',
                     'timeout_origin': 'node', 'revision': 'unknown', 'version': 'unknown',
                     'trace': [{'stage': 'module_import', 'elapsed_ms': 2}]}
    assert record.exc_info is None and record.args == ()


def test_progress_decoder_bounds_malformed_fragmented_and_flooded_stderr():
    from wiki.format_diagnostics import Progress
    progress = Progress()
    progress.feed(b'raw private\nbackstory-format:{"stage":"module_')
    progress.feed(b'import","elapsed_ms":2}\nbackstory-format:{"stage":"private-path","elapsed_ms":3}\n')
    progress.feed(b'backstory-format:{"stage":"input","elapsed_ms":1}\n')
    progress.feed(b'backstory-format:{"stage":[],"elapsed_ms":4}\n')
    progress.feed(b'private raw stderr' * 100000)
    progress.feed(b'\nbackstory-format:{"stage":"output","elapsed_ms":8}\n')
    assert progress.trace == [{'stage': 'module_import', 'elapsed_ms': 2}]
    assert progress.remaining == 0 and progress.pending == b''
