import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import date
from pathlib import Path


@dataclass(frozen=True)
class Task:
    key: str
    title: str
    deadline: date | None
    status: str
    assignee: str
    tags: tuple[str, ...]
    dependencies: str
    effort: str
    path: Path


# ── Team roster ──────────────────────────────────────────────
# Update these once real names / GitHub usernames are confirmed.
TEAM_MEMBERS = {
    "matdevstamp": "Lead",
    "Kassim10": "TBD",
    "rcilomba": "Ramadan",
    "umoraghad0-del": "TBD",
}

# Role-to-username mapping.  Fill in during the kickoff meeting.
# The CLI's ``plan kickoff`` command uses this to suggest assignments.
ROLE_TO_USER = {
    "Person 1": None,  # Scaffold pair, backend/auth → assign to a GitHub username
    "Person 2": None,  # Scaffold pair, frontend shell
    "Person 3": None,  # Database, patient/record domain
    "Person 4": None,  # Blockchain, P2P, Socket.IO
}

KICKOFF_ASSIGNMENTS = {
    "01": "Team",
    "02": "Team",
    "03": "Person 2",
    "04": "Person 3",
    "05": "Person 2",
    "06": "Person 1",
    "07": "Person 1",
    "08": "Person 2",
    "09": "Person 2",
    "10": "Person 1",
    "11": "Person 1",
    "12": "Person 2",
    "13": "Person 3",
    "14": "Person 3",
    "15": "Person 4",
    "16": "Person 4",
    "17": "Team",
    "18": "Person 4",
    "19": "Team",
    "20": "Person 2",
    "21": "Team",
}


_METADATA = {
    "deadline": re.compile(r"^- \*\*Deadline:\*\*\s*(.+)$", re.MULTILINE),
    "status": re.compile(r"^- \*\*Status:\*\*\s*(.+)$", re.MULTILINE),
    "assignee": re.compile(r"^- \*\*Assignee:\*\*\s*(.+)$", re.MULTILINE),
    "tags": re.compile(r"^- \*\*Tags:\*\*\s*(.+)$", re.MULTILINE),
    "dependencies": re.compile(r"^- \*\*Dependencies:\*\*\s*(.+)$", re.MULTILINE),
    "effort": re.compile(r"^- \*\*Estimated Effort:\*\*\s*(.+)$", re.MULTILINE),
}


def _metadata(text, name, default=""):
    match = _METADATA[name].search(text)
    return match.group(1).strip() if match else default


def read_task(path):
    text = path.read_text(encoding="utf-8")
    title_match = re.search(r"^# Task:\s*(.+)$", text, re.MULTILINE)
    if not title_match:
        raise ValueError(f"Missing task title in {path}")
    key = path.stem.split("-", 1)[0]
    deadline_text = _metadata(text, "deadline")
    deadline_match = re.search(r"\d{4}-\d{2}-\d{2}", deadline_text)
    deadline = date.fromisoformat(deadline_match.group(0)) if deadline_match else None
    tags = tuple(tag.strip() for tag in _metadata(text, "tags").split(",") if tag.strip())
    return Task(
        key=key,
        title=title_match.group(1).strip(),
        deadline=deadline,
        status=_metadata(text, "status", "TODO"),
        assignee=_metadata(text, "assignee", "TBD"),
        tags=tags,
        dependencies=_metadata(text, "dependencies", "None"),
        effort=_metadata(text, "effort", "unspecified"),
        path=path,
    )


def load_tasks(directory):
    return tuple(read_task(path) for path in sorted(Path(directory).glob("*.md")))


def task_state(task, today=None):
    today = today or date.today()
    if task.status.upper() in {"DONE", "COMPLETE", "COMPLETED"}:
        return "done"
    if task.deadline and task.deadline < today:
        return "overdue"
    if task.assignee.upper() in {"TBD", "TEAM"}:
        return "unassigned"
    return "planned"


def task_line(task, today=None):
    deadline = task.deadline.isoformat() if task.deadline else "no deadline"
    return f"{task.key} | {deadline} | {task_state(task, today):9} | {task.assignee:12} | {task.title}"


def schedule_warnings(tasks):
    warnings = []
    by_deadline = defaultdict(list)
    by_key = {task.key: task for task in tasks}
    for task in tasks:
        if task.deadline:
            by_deadline[task.deadline].append(task)
    for deadline, grouped in sorted(by_deadline.items()):
        if len(grouped) > 1:
            names = ", ".join(f"{task.key} {task.title}" for task in grouped)
            warnings.append(f"Duplicate deadline {deadline}: {names}")
    for task in tasks:
        if not task.deadline or task.dependencies.lower() == "none":
            continue
        for dependency in task.dependencies.split(","):
            dependency_key = Path(dependency.strip()).stem.split("-", 1)[0]
            prerequisite = by_key.get(dependency_key)
            if prerequisite and prerequisite.deadline and prerequisite.deadline > task.deadline:
                warnings.append(
                    f"Dependency deadline violation: {task.key} is due {task.deadline} "
                    f"before {dependency_key} is due {prerequisite.deadline}"
                )
    return tuple(warnings)


def update_task_reference(path, issue_number, issue_url):
    """Stamp a draft task file with the GitHub issue it was created from.

    Inserts a ``- **GitHub Issue:**`` line into the Metadata section.
    If one already exists it is replaced in place.
    """
    text = path.read_text(encoding="utf-8")
    new_line = f"- **GitHub Issue:** #{issue_number} ({issue_url})"
    existing = re.compile(r"^- \*\*GitHub Issue:\*\*.*$", re.MULTILINE)
    if existing.search(text):
        text = existing.sub(new_line, text)
    else:
        # Insert after the Dependencies or Estimated Effort line
        anchor = re.compile(
            r"(^- \*\*(?:Estimated Effort|Dependencies):\*\*.*$)",
            re.MULTILINE,
        )
        match = anchor.search(text)
        if match:
            insert_pos = match.end()
            text = text[:insert_pos] + "\n" + new_line + text[insert_pos:]
        else:
            # Fallback: insert after the Metadata header
            header = re.compile(r"^(## Metadata\n)", re.MULTILINE)
            match = header.search(text)
            if match:
                insert_pos = match.end()
                text = text[:insert_pos] + new_line + "\n" + text[insert_pos:]
    path.write_text(text, encoding="utf-8")


def draft_task_to_project_fields(task):
    """Map a draft task's metadata to GitHub Projects custom field values.

    Returns a dict like ``{"Priority": "P0", "Gate": "1-Decisions", ...}``.
    Only fields that can be derived from the draft are included.
    """
    fields = {}
    # Priority: map from effort or default to P0
    effort_map = {"unspecified": "P0", "1h": "P0", "2h": "P0", "3h": "P1",
                  "4h": "P1", "6h": "P1", "8h": "P2"}
    fields["Priority"] = effort_map.get(task.effort.lower(), "P0")
    # Status: NOT set automatically — the kanban columns handle workflow.
    # Only set manually when something is stuck or needs attention.
    # Size: map from effort
    size_map = {"unspecified": "M", "1h": "XS", "2h": "S", "3h": "S",
                "4h": "M", "6h": "M", "8h": "L"}
    fields["Size"] = size_map.get(task.effort.lower(), "M")
    # Estimate: extract numeric hours from effort string
    import re as _re
    hours_match = _re.search(r"(\d+)", task.effort)
    if hours_match:
        fields["Estimate"] = hours_match.group(1)
    # Target date: use the deadline if present
    if task.deadline:
        fields["Target date"] = task.deadline.isoformat()
    # Gate and Stream: extract from tags
    gate_map = {
        "gate:1-decisions": "1-Decisions",
        "gate:2-scaffold": "2-Scaffold",
        "gate:3-features": "3-Features",
        "gate:4-integration": "4-Integration",
        "gate:5-delivery": "5-Delivery",
    }
    stream_map = {
        "stream:A-identity": "A-Identity",
        "stream:B-patient": "B-Patient",
        "stream:C-notes": "C-Notes",
        "stream:D-audit": "D-Audit",
    }
    for tag in task.tags:
        tag_lower = tag.lower().strip()
        if tag_lower in gate_map:
            fields["Gate"] = gate_map[tag_lower]
        if tag_lower in stream_map:
            fields["Stream"] = stream_map[tag_lower]
    return fields


def draft_task_clean_body(path):
    """Extract a clean issue body from a draft task markdown file.

    Returns only the Requirements, Tasks, and Done Criteria sections —
    no metadata lines (Deadline, Assignee, etc.) since those belong in
    GitHub Projects custom fields.
    """
    text = path.read_text(encoding="utf-8")
    # Strip the title line
    text = re.sub(r"^# Task:.*\n", "", text, count=1, flags=re.MULTILINE)
    # Strip the Metadata section entirely
    text = re.sub(
        r"## Metadata\n.*?(?=## |\Z)",
        "",
        text,
        flags=re.DOTALL | re.MULTILINE,
    )
    # Strip Design and Notes sections (too verbose for issue body)
    text = re.sub(
        r"## (?:Design|Notes|Questions to Resolve|User Stories)\n.*?(?=## |\Z)",
        "",
        text,
        flags=re.DOTALL | re.MULTILINE,
    )
    # Clean up excessive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
