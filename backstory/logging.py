"""Only fixed event codes reach web-server/application log handlers."""
import logging


class RedactRequest(logging.Filter):
    def filter(self, record):
        record.msg = 'request_error' if record.levelno >= logging.ERROR else 'request_event'
        record.args = ()
        record.exc_info = None
        record.exc_text = None
        record.stack_info = None
        for name in ('request', 'status_code'):
            record.__dict__.pop(name, None)
        return True


from gunicorn.glogging import Logger


class SafeGunicornLogger(Logger):
    def setup(self, cfg):
        super().setup(cfg)
        for logger in (self.error_log, self.access_log):
            logger.addFilter(RedactRequest())
            for handler in logger.handlers:
                handler.addFilter(RedactRequest())
