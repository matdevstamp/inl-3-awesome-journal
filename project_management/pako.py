"""Shareable Mermaid Live URLs, compressed the way mermaid.live does it.

mermaid.live encodes a diagram into a hash fragment like::

    https://mermaid.live/edit#pako:<payload>

where ``<payload>`` is ``pako.deflate(code, { to: 'string' })`` encoded with
URL-safe base64 (no padding). pako's default ``deflate`` emits a zlib-wrapped
stream (``0x78`` header), which is exactly what :mod:`zlib` produces, so the
same scheme is reproducible here without the JavaScript dependency.

Every generated payload is immediately verified: :func:`compress` decodes
its own output and refuses to return a string that does not round-trip back
to the original diagram source.
"""

from __future__ import annotations

import base64
import zlib

_LIVE_PREFIX = "https://mermaid.live/edit#pako:"


def compress(code):
    """Compress ``code`` into the mermaid.live payload (zlib + URL-safe b64).

    Raises ``RuntimeError`` if the payload does not decode back to ``code``.
    """
    raw = zlib.compress(code.encode("utf-8"))
    payload = base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")
    if decompress(payload) != code:
        raise RuntimeError(
            "pako verification failed: payload did not round-trip back to the "
            "diagram source; refusing to emit a broken mermaid.live URL"
        )
    return payload


def decompress(payload):
    """Inverse of :func:`compress`: payload -> original diagram source."""
    b64 = payload + "=" * (-len(payload) % 4)
    return zlib.decompress(base64.urlsafe_b64decode(b64)).decode("utf-8")


def mermaid_live_url(code):
    """Return a verified ``https://mermaid.live/edit#pako:...`` URL for ``code``."""
    return _LIVE_PREFIX + compress(code)