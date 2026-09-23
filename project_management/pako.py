"""Shareable Mermaid Live URLs, matching mermaid.live's own serde scheme.

mermaid.live (mermaid-js/mermaid-live-editor) serializes its editor state
into a URL hash::

    https://mermaid.live/edit#pako:<payload>

Its ``pakoSerde`` (``src/lib/util/serde.ts``) is::

    serialize(state): TextEncoder -> deflate(level 9) -> URL-safe base64

where ``state`` is ``JSON.stringify({ code, mermaid, updateDiagram, rough,
grid, panZoom })``. pako's default ``deflate`` emits a zlib-wrapped stream
(``0x78`` header), which is exactly what :mod:`zlib` produces, so the whole
scheme is reproducible here without the JavaScript dependency.

Every generated payload is immediately verified: :func:`compress` inflates
its own output and refuses to return a payload that does not decode back to
the exact ``{ code, ... }`` state JSON the site would try to parse.
"""

from __future__ import annotations

import base64
import json
import zlib

_LIVE_PREFIX = "https://mermaid.live/edit#pako:"

# Mirrors mermaid-live-editor's `defaultState` (src/lib/constants.ts) so a
# fresh editor tab can load the diagram unchanged.
_DEFAULT_STATE = {
    "grid": True,
    "mermaid": "{}",
    "panZoom": True,
    "rough": False,
    "updateDiagram": True,
}


def _state_json(code):
    """Serialize mermaid.live's editor State the way `JSON.stringify` does."""
    return json.dumps(
        {"code": code, **_DEFAULT_STATE},
        ensure_ascii=False,
        separators=(",", ":"),
    )


def compress(code):
    """Compress ``code`` into the mermaid.live ``#pako:`` payload.

    Raises ``RuntimeError`` if the payload does not inflate back to the exact
    state JSON with the original ``code``.
    """
    raw = zlib.compress(_state_json(code).encode("utf-8"), 9)
    payload = base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")
    decoded = decompress(payload)
    if decoded != code:
        raise RuntimeError(
            "pako verification failed: payload did not round-trip back to the "
            "diagram source; refusing to emit a broken mermaid.live URL"
        )
    return payload


def decompress(payload):
    """Inverse of :func:`compress`: payload -> the original diagram source."""
    b64 = payload + "=" * (-len(payload) % 4)
    state = json.loads(zlib.decompress(base64.urlsafe_b64decode(b64)).decode("utf-8"))
    return state["code"]


def mermaid_live_url(code):
    """Return a verified ``https://mermaid.live/edit#pako:...`` URL for ``code``."""
    return _LIVE_PREFIX + compress(code)