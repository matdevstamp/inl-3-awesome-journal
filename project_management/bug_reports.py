import csv
import os
import tempfile
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

CSV_FIELDS = (
    "report_id",
    "reported_at",
    "reporter",
    "summary",
    "steps_to_reproduce",
    "expected_behavior",
    "actual_behavior",
    "environment",
    "severity",
    "evidence",
    "privacy_checked",
    "triage_status",
    "lead_owner",
    "draft_task",
    "github_issue",
    "resolution",
)


@dataclass(frozen=True)
class BugReport:
    values: dict[str, str]

    @property
    def report_id(self):
        return self.values["report_id"]

    @property
    def status(self):
        return self.values.get("triage_status", "untriaged") or "untriaged"


def load_reports(path):
    with Path(path).open(newline="", encoding="utf-8") as handle:
        return tuple(BugReport(dict(row)) for row in csv.DictReader(handle))


def _write_reports(path, rows):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        "w", newline="", encoding="utf-8", dir=path.parent, delete=False
    ) as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(rows)
        temporary_path = handle.name
    os.replace(temporary_path, path)


def promote_report(csv_path, report_id, draft_directory, assignee, deadline):
    reports = load_reports(csv_path)
    report = next((item for item in reports if item.report_id == report_id), None)
    if report is None:
        raise ValueError(f"Bug report {report_id} was not found.")
    if report.status != "accepted":
        raise ValueError(
            f"Bug report {report_id} has status '{report.status}'; lead triage must set it to accepted first."
        )
    if report.values.get("privacy_checked", "").lower() != "yes":
        raise ValueError(f"Bug report {report_id} must pass the privacy check before promotion.")
    if report.values.get("draft_task"):
        raise ValueError(
            f"Bug report {report_id} already has draft task {report.values['draft_task']}."
        )

    safe_id = report_id.lower().replace(" ", "-")
    draft_path = Path(draft_directory) / f"bug-{safe_id}.md"
    draft_path.parent.mkdir(parents=True, exist_ok=True)
    if draft_path.exists():
        raise ValueError(f"Draft task already exists: {draft_path}")
    created_at = datetime.now(UTC).replace(microsecond=0).isoformat()
    values = report.values
    title = values.get("summary") or f"Resolve {report_id}"
    body = f"""# Task: Bug fix - {title}

## Metadata
- **Source bug report:** {report_id}
- **Source file:** {csv_path}
- **Reported at:** {values.get("reported_at", "")}
- **Created from report at:** {created_at}
- **Priority:** {values.get("severity", "TBD")}
- **Deadline:** {deadline or "TBD"}
- **Status:** TODO
- **Assignee:** {assignee or "TBD"}
- **Tags:** bug, regression, e2e
- **Dependencies:** None
- **Estimated Effort:** TBD
- **Lineage:** raw bug report {report_id} -> this draft task -> GitHub issue/PR -> regression evidence

## Requirements

- Reproduce the reported behavior with a focused test.
- Fix the root cause without regressing the expected behavior.
- Preserve the privacy and authorization boundaries of the application.

## Reproduction

**Steps:** {values.get("steps_to_reproduce", "Record sanitized reproduction steps.")}

**Expected:** {values.get("expected_behavior", "Document the expected behavior.")}

**Actual:** {values.get("actual_behavior", "Document the observed behavior.")}

**Environment:** {values.get("environment", "Record the relevant local or CI environment.")}

## Tasks

- [ ] Add a focused Playwright E2E reproduction test, or the narrowest suitable test.
- [ ] Run the reproduction test and record the red failure.
- [ ] Implement the smallest root-cause fix.
- [ ] Run the same test and record the green result.
- [ ] Add unit/integration coverage if the defect crosses an API, policy, database, or blockchain boundary.
- [ ] Open a PR linking `{report_id}` and this draft task.

## Done Criteria

- [ ] Reproduction test fails before the fix.
- [ ] Reproduction test passes after the fix.
- [ ] CI passes.
- [ ] PR explains the root cause and links the lineage.
- [ ] Lead verifies the fix and updates the raw report.
"""
    draft_path.write_text(body, encoding="utf-8")

    updated_rows = []
    for item in reports:
        row = dict(item.values)
        if item.report_id == report_id:
            row["triage_status"] = "draft-created"
            row["draft_task"] = str(draft_path)
            row["lead_owner"] = row.get("lead_owner") or "lead"
        updated_rows.append(row)
    _write_reports(csv_path, updated_rows)
    return draft_path


def triage_report(csv_path, report_id, status, lead_owner=None):
    reports = load_reports(csv_path)
    if not any(report.report_id == report_id for report in reports):
        raise ValueError(f"Bug report {report_id} was not found.")
    rows = []
    for report in reports:
        row = dict(report.values)
        if report.report_id == report_id:
            row["triage_status"] = status
            if lead_owner:
                row["lead_owner"] = lead_owner
        rows.append(row)
    _write_reports(csv_path, rows)
