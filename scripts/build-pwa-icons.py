"""Rebuild original opaque book-mark icons using only Python's standard library.

The book stays inside the maskable central 80%-diameter safe circle.
"""
from pathlib import Path
import struct
import zlib

ROOT = Path(__file__).resolve().parents[1] / "static" / "icons"


def chunk(kind, data):
    return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))


for size in (192, 512):
    rows = bytearray()
    for y in range(size):
        rows.append(0)
        for x in range(size):
            u, v = x / size, y / size
            color = (26, 27, 38)
            if .25 <= u < .75 and .27 <= v < .73:
                color = (122, 162, 247)
                if .48 <= u < .52 or (.30 <= u < .45 or .55 <= u < .70) and any(a <= v < a + .025 for a in (.37, .47, .57)):
                    color = (26, 27, 38)
            rows.extend(color)
    raw = b'\x89PNG\r\n\x1a\n'
    raw += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
    raw += chunk(b'IDAT', zlib.compress(bytes(rows), 9)) + chunk(b'IEND', b'')
    ROOT.mkdir(parents=True, exist_ok=True)
    (ROOT / f'backstory-{size}.png').write_bytes(raw)
