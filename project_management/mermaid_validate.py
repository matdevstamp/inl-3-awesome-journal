"""Structural validation for generated Mermaid diagrams (mermaid 11.x).

``mermaid.parse()`` accepts diagrams that still fail when a renderer runs
(GitHub renders mermaid 11.x). This validator encodes the failure classes seen
in the wild so generation scripts can reject bad output before writing:

- legacy ``classDef name,fill:...`` syntax — parse error on mermaid 11
- gantt rows with a ``skipped`` state — "Invalid date:skipped" render error
- colons inside unquoted gantt task names — the date parser splits on ``:``
- malformed gantt rows (state/date/duration not matching the grammar)
- unbalanced quotes in flowchart node labels

Call :func:`validate_mermaid` on a mermaid block (kind auto-detected); it
returns a list of human-readable problems (empty list == OK).
"""

from __future__ import annotations

import re
from datetime import datetime

_GANTT_ROW = re.compile(
    r"^\s*(?P<label>.+?)\s*:\s*(?P<state>active|done|crit)\s*,\s*"
    r"(?P<date>\d{4}-\d{2}-\d{2})\s*,\s*(?P<days>\d+)d\s*$"
)
_LEGACY_CLASSDEF = re.compile(r"^\s*classDef\s+[A-Za-z0-9_]+\s*,")
_NODE_LINE = re.compile(r'^\s*[A-Za-z0-9_]+\["(?P<body>[^"]*)"\]\s*$')


def _flowchart_errors(code):
    errors = []
    for lineno, raw in enumerate(code.splitlines(), start=1):
        line = raw.rstrip()
        stripped = line.strip()
        if not stripped or stripped.startswith("%%"):
            continue
        if stripped.startswith(("flowchart", "graph")):
            continue
        if _LEGACY_CLASSDEF.search(line):
            errors.append(
                f"line {lineno}: legacy `classDef name,style` syntax "
                "(mermaid 11 needs a space: `classDef name style`)"
            )
        if '"' in line and line.count('"') % 2 != 0:
            errors.append(f"line {lineno}: unbalanced quotes: {line.strip()[:80]}")
        if stripped.startswith(("class ", "classDef ", "subgraph ", "end")):
            continue
        if "[" in line and "]" in line:
            if not _NODE_LINE.match(line) and "-->|" not in line:
                errors.append(f"line {lineno}: unexpected node shape: {line.strip()[:80]}")
    return errors


def _gantt_errors(code):
    errors = []
    saw_date_format = False
    for lineno, raw in enumerate(code.splitlines(), start=1):
        stripped = raw.strip()
        if not stripped or stripped.startswith("%%"):
            continue
        first = stripped.split(None, 1)[0].lower() if stripped else ""
        if first == "dateformat":
            saw_date_format = True
            continue
        if first in ("title", "axisformat", "todaymarker", "section", "gantt", "config", "click"):
            continue
        match = _GANTT_ROW.match(raw)
        if not match:
            errors.append(
                f"line {lineno}: malformed gantt row (state must be active/done/crit, "
                f"date YYYY-MM-DD, duration Nd): {stripped[:90]}"
            )
            continue
        label = match.group("label")
        if "skipped" in label.lower():
            errors.append(
                f"line {lineno}: gantt has no 'skipped' state — undated tasks must be "
                f"listed outside the chart: {stripped[:90]}"
            )
        if ":" in label:
            errors.append(
                f"line {lineno}: colon inside unquoted gantt task name confuses the date "
                f"parser — sanitize it: {stripped[:90]}"
            )
        try:
            datetime.strptime(match.group("date"), "%Y-%m-%d")
        except ValueError:
            errors.append(f"line {lineno}: invalid date {match.group('date')}")
    if not saw_date_format:
        errors.append("missing `dateFormat` directive")
    return errors


def validate_mermaid(code, kind=None):
    """Validate one mermaid block. ``kind`` is 'flowchart' | 'gantt' (auto-detected)."""
    if kind is None:
        first = next((line for line in code.splitlines() if line.strip()), "").strip()
        kind = "gantt" if first.startswith("gantt") else "flowchart"
    if kind == "gantt":
        return _gantt_errors(code)
    return _flowchart_errors(code)
