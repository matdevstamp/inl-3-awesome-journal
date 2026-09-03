import argparse
import contextlib
import json
import sys
from datetime import UTC, datetime
from pathlib import Path

from .bug_reports import load_reports, promote_report, triage_report
from .github import GitHubClient, GitHubError
from .mermaid_validate import validate_mermaid
from .planner import (
    KICKOFF_ASSIGNMENTS,
    ROLE_TO_USER,
    draft_task_clean_body,
    draft_task_to_project_fields,
    gantt_unscheduled,
    load_tasks,
    read_task,
    resolve_issue_stamps,
    schedule_warnings,
    task_gantt_mermaid,
    task_graph_mermaid,
    task_issue_stamp,
    task_line,
    task_state,
    update_related_line,
    update_task_reference,
)
from .reporting import (
    build_report,
    diff_reports,
    load_snapshot,
    save_snapshot,
    snapshot_for_report,
    write_report_xlsx,
)

LABELS = (
    ("type:feature", "c5def5", "New functionality"),
    ("type:bug", "d73a4a", "Something broken"),
    ("type:docs", "0e8a16", "Documentation only"),
    ("type:chore", "c4c4c4", "Maintenance, config, setup"),
    ("type:testing", "7057ff", "Test creation or updates"),
    ("type:architecture", "0075ca", "Design decisions and diagrams"),
)
OBSOLETE_CUSTOM_FIELD_LABELS = (
    *["P0-critical", "P1-high", "P2-medium", "P3-low"],
    *(f"status:{name}" for name in ("todo", "in-progress", "blocked", "review", "done")),
)

# Legend blocks rendered above the diagrams in the generated markdown docs.
GRAPH_LEGEND = """## Legend

| Symbol | Meaning |
|---|---|
| `A --> B` (solid arrow) | B depends on A — B is **blocked by** A |
| `A -. related .- B` (dotted line) | A and B are **related** (soft link, not a dependency) |
| 🟢 green node | task **done** (marked ✓) |
| 🔵 blue node | **in progress** |
| ⬜ dashed-gray node | **todo** — not started |
| `(50% · 3/6 · doing)` | checkbox progress: 3 of 6 task boxes ticked, then the status |
| `(0/0 · todo)` | no checkboxes written yet — the checklist itself is still to be made |

Nodes are grouped into **Gate** subgraphs when tagged (`gate:1-decisions` …
`gate:5-delivery`). Tick `- [x]` boxes in the draft task files as the work
happens, then regenerate this diagram to update the percentages.
"""

GANTT_LEGEND = """## Legend

| Bar | Meaning |
|---|---|
| `✓` task | **done** — rendered in the mermaid `done` style |
| plain task | **active** — scheduled work (or in progress) |
| `(50% · 3/6 · doing)` | checkbox progress + status, same format as the dependency graph |

Same design as the dependency graph: every task ends on its deadline (or on the
earliest deadline of the tasks that depend on it); duration comes from the
Estimated Effort. Tasks are grouped into Gate sections. Tasks with no usable
date cannot be drawn as a bar — they are listed under the chart until they get
a **Deadline**. (Mermaid gantt has no 'skipped' row state.)
"""


def build_parser():
    parser = argparse.ArgumentParser(prog="project-management")
    parser.add_argument("--json", action="store_true", help="Print machine-readable output.")
    commands = parser.add_subparsers(dest="command", required=True)

    status = commands.add_parser("status", help="Show issues and project custom-field status.")
    status.add_argument("--state", choices=("open", "closed", "all"), default="open")

    plan = commands.add_parser("plan", help="Review the local project plan.")
    plan_commands = plan.add_subparsers(dest="plan_command", required=True)
    plan_show = plan_commands.add_parser("show", help="Show tasks, deadlines, and assignments.")
    plan_show.add_argument("--directory", default="docs/draft_tasks")
    plan_show.add_argument("--only", choices=("unassigned", "overdue", "planned", "done"))
    kickoff = plan_commands.add_parser(
        "kickoff", help="Show the recommended four-person task split."
    )
    kickoff.add_argument("--directory", default="docs/draft_tasks")
    check = plan_commands.add_parser(
        "check", help="Warn about schedule collisions and dependency problems."
    )
    check.add_argument("--directory", default="docs/draft_tasks")
    graph = plan_commands.add_parser("graph", help="Print a Mermaid graph of task relationships.")
    graph.add_argument("--directory", default="docs/draft_tasks")
    graph.add_argument("--output", help="Write the diagram to this file instead of stdout.")
    gantt = plan_commands.add_parser("gantt", help="Print a Mermaid Gantt chart of the timeline.")
    gantt.add_argument("--directory", default="docs/draft_tasks")
    gantt.add_argument("--output", help="Write the diagram to this file instead of stdout.")

    deps = commands.add_parser(
        "deps", help="Synchronize issue relationships (blocked by / related) on GitHub."
    )
    deps_commands = deps.add_subparsers(dest="deps_command", required=True)
    deps_sync = deps_commands.add_parser(
        "sync",
        help="Apply draft dependencies/related to GitHub issues (idempotent, creates no issues).",
    )
    deps_sync.add_argument("--draft-directory", default="docs/draft_tasks")
    deps_sync.add_argument(
        "--dry-run", action="store_true", help="Show what would change without writing."
    )

    report = commands.add_parser(
        "report", help="Stakeholder reports that merge GitHub state with the local plan."
    )
    report_commands = report.add_subparsers(dest="report_command", required=True)
    report_export = report_commands.add_parser(
        "export",
        help="Export an .xlsx stakeholder workbook (Overview, Changelog, Tasks, Questions).",
    )
    report_export.add_argument("--output", default="stakeholder-report.xlsx")
    report_export.add_argument("--draft-directory", default="docs/draft_tasks")

    bug = commands.add_parser("bug", help="Review and promote raw bug reports.")
    bug_commands = bug.add_subparsers(dest="bug_command", required=True)
    bug_list = bug_commands.add_parser("list", help="List raw bug reports.")
    bug_list.add_argument("--csv", default="docs/bug-reports.csv")
    bug_list.add_argument("--status", dest="bug_status")
    triage = bug_commands.add_parser("triage", help="Set a report's lead triage status.")
    triage.add_argument("report_id")
    triage.add_argument(
        "--status",
        required=True,
        choices=(
            "untriaged",
            "accepted",
            "duplicate",
            "not-reproducible",
            "expected-behavior",
            "in-progress",
            "verified",
            "closed",
        ),
    )
    triage.add_argument("--lead-owner")
    triage.add_argument("--csv", default="docs/bug-reports.csv")
    promote = bug_commands.add_parser(
        "promote", help="Convert an accepted report into a stamped draft task."
    )
    promote.add_argument("report_id")
    promote.add_argument("--csv", default="docs/bug-reports.csv")
    promote.add_argument("--draft-directory", default="docs/draft_tasks")
    promote.add_argument("--assignee")
    promote.add_argument("--deadline")
    promote.add_argument("--yes", action="store_true")

    issue = commands.add_parser("issue", help="Manage GitHub issues.")
    issue_commands = issue.add_subparsers(dest="issue_command", required=True)
    issue_list = issue_commands.add_parser("list", help="List issues.")
    issue_list.add_argument("--state", choices=("open", "closed", "all"), default="open")
    view = issue_commands.add_parser("view", help="View one issue.")
    view.add_argument("number", type=int)
    create = issue_commands.add_parser("create", help="Create an issue.")
    create.add_argument("--title", required=True)
    create.add_argument("--body", default="")
    create.add_argument("--label", action="append", dest="labels", default=[])
    create.add_argument("--assignee")
    create.add_argument("--deadline", help="ISO date, recorded in the issue body.")
    edit = issue_commands.add_parser("edit", help="Update an issue.")
    edit.add_argument("number", type=int)
    edit.add_argument("--title")
    edit.add_argument("--body")
    edit.add_argument("--state", choices=("open", "closed"))
    edit.add_argument("--assignee")
    close = issue_commands.add_parser("close", help="Close an issue.")
    close.add_argument("number", type=int)
    close.add_argument("--yes", action="store_true")
    comment = issue_commands.add_parser("comment", help="Add a comment.")
    comment.add_argument("number", type=int)
    comment.add_argument("body")

    task = commands.add_parser("task", help="Convenience alias for issue creation.")
    task_create = task.add_subparsers(dest="task_command", required=True).add_parser(
        "create", help="Create one GitHub task."
    )
    task_create.add_argument("--title", required=True)
    task_create.add_argument("--body", default="")
    task_create.add_argument("--label", action="append", dest="labels", default=[])
    task_create.add_argument("--assignee")
    task_create.add_argument("--deadline", help="ISO date, recorded in the issue body.")
    task_create.add_argument(
        "--depends-on",
        action="append",
        dest="depends_on",
        default=[],
        type=int,
        help="Issue number this task is blocked by (may be repeated).",
    )
    task_create.add_argument(
        "--related-to",
        action="append",
        dest="related_to",
        default=[],
        type=int,
        help="Issue number this task is related to (may be repeated); recorded in the issue body.",
    )
    task_create.add_argument(
        "--draft",
        help="Path to a draft task markdown file. On success the file is stamped with the GitHub issue reference.",
    )

    project = commands.add_parser("project", help="Inspect GitHub Projects custom fields.")
    project.add_subparsers(dest="project_command", required=True).add_parser(
        "status", help="Show project fields and their issue values."
    )

    pr = commands.add_parser("pr", help="Inspect pull requests.")
    pr_list = pr.add_subparsers(dest="pr_command", required=True).add_parser("list")
    pr_list.add_argument("--state", choices=("open", "closed", "all"), default="open")

    labels = commands.add_parser("labels", help="Synchronize non-custom-field labels.")
    labels.add_argument("action", choices=("sync",))
    return parser


def output(value, as_json=False):
    if as_json:
        print(json.dumps(value, indent=2))
    elif isinstance(value, list):
        for item in value:
            print(item)
    else:
        print(value)


def issue_line(issue):
    labels = ", ".join(label["name"] for label in issue.get("labels", []))
    suffix = f" [{labels}]" if labels else ""
    return f"#{issue['number']} {issue['title']} ({issue['state']}){suffix} {issue['html_url']}"


def status_report(client, state):
    issues = [issue for issue in client.issues(state) if "pull_request" not in issue]
    return {"repository": client.repository, "issues": issues, "count": len(issues)}


def deps_sync(client, draft_directory, dry_run=False):
    """Apply draft Dependencies/Related metadata to stamped GitHub issues.

    Idempotent and additive: only missing 'blocked by' relationships are
    created and the Related line is only added to an issue body when absent.
    No issues are created.

    Returns a summary dict for reporting.
    """
    results = []
    linked = 0
    related_updated = 0
    for task in load_tasks(draft_directory):
        issue_number = task_issue_stamp(task.path)
        if issue_number is None:
            continue
        entry = {
            "issue": issue_number,
            "title": task.title,
            "blocked_by": [],
            "related": [],
            "skipped": [],
        }
        dep_numbers, dep_unresolved = resolve_issue_stamps(task.path, task.dependencies)
        rel_numbers, rel_unresolved = resolve_issue_stamps(task.path, ", ".join(task.related))
        entry["skipped"] = dep_unresolved + rel_unresolved

        # Blocked by: add only relationships that are missing.
        existing = {dep["number"] for dep in client.list_dependencies(issue_number)}
        for dep_number in dict.fromkeys(dep_numbers):
            if dep_number in existing:
                continue
            if not dry_run:
                blocking = client.issue(dep_number)
                client.add_dependency(issue_number, blocking["id"])
            entry["blocked_by"].append(dep_number)
            linked += 1

        # Related: GitHub has no native relationship type, so record it as a
        # ``**Related:**`` line in the issue body (idempotent).
        related_numbers = list(dict.fromkeys(rel_numbers))
        if related_numbers:
            body = client.issue(issue_number).get("body") or ""
            if update_related_line(body, related_numbers) != body:
                if not dry_run:
                    client.update_issue(
                        issue_number, body=update_related_line(body, related_numbers)
                    )
                entry["related"] = related_numbers
                related_updated += 1
        results.append(entry)
    return {"results": results, "linked": linked, "related_updated": related_updated}


def main():
    args = build_parser().parse_args()
    try:
        if args.command == "plan":
            tasks = load_tasks(args.directory)
            if args.plan_command in ("graph", "gantt"):
                if args.plan_command == "graph":
                    mermaid = task_graph_mermaid(tasks)
                else:
                    mermaid = task_gantt_mermaid(tasks)
                errors = validate_mermaid(mermaid)
                if errors:
                    raise ValueError(
                        "Mermaid validation failed; nothing written:\n- "
                        + "\n- ".join(errors)
                    )
                if args.output:
                    output_path = Path(args.output)
                    if output_path.suffix.lower() == ".md":
                        # Markdown output renders the diagram on GitHub; do not hand-edit.
                        title = "Task Dependency Graph" if args.plan_command == "graph" else "Task Timeline (Gantt)"
                        legend = GRAPH_LEGEND if args.plan_command == "graph" else GANTT_LEGEND
                        content = (
                            f"# {title}\n\n"
                            "_Auto-generated from the draft tasks in `docs/draft_tasks/`. "
                            "Do not edit by hand._\n\n"
                            "Regenerate whenever task metadata changes:\n\n"
                            "```bash\n"
                            "python3 -m project_management plan "
                            f"{args.plan_command} --output {output_path}\n"
                            "```\n\n"
                            f"{legend}"
                            "\n```mermaid\n"
                            f"{mermaid}"
                            "```\n"
                        )
                        if args.plan_command == "gantt":
                            unscheduled = gantt_unscheduled(tasks)
                            if unscheduled:
                                content += (
                                    "\n_Not scheduled yet (no **Deadline** — add one to draw a bar): "
                                    + ", ".join(f"`{key}`" for key in unscheduled)
                                    + "_\n"
                                )
                        output_path.write_text(content, encoding="utf-8")
                    else:
                        output_path.write_text(mermaid, encoding="utf-8")
                    print(f"Wrote {args.output}")
                else:
                    print(mermaid, end="")
                return
            if args.plan_command == "check":
                warnings = schedule_warnings(tasks)
                if args.json:
                    output({"warnings": warnings, "count": len(warnings)}, True)
                elif warnings:
                    for warning in warnings:
                        print(f"WARNING: {warning}")
                else:
                    print("Schedule looks consistent.")
                return
            if args.plan_command == "kickoff":

                def _resolve(role_name):
                    """Map a placeholder like 'Person 1' to a real GitHub username."""
                    if ROLE_TO_USER.get(role_name):
                        return ROLE_TO_USER[role_name]
                    return role_name

                assignments = [
                    {
                        "key": task.key,
                        "title": task.title,
                        "deadline": task.deadline.isoformat() if task.deadline else None,
                        "assignee": _resolve(KICKOFF_ASSIGNMENTS.get(task.key, task.assignee)),
                        "dependencies": task.dependencies,
                        "related": list(task.related),
                    }
                    for task in tasks
                ]
                output(
                    assignments
                    if args.json
                    else [
                        f"{item['key']} | {item['deadline'] or 'no deadline'} | {item['assignee']:20} | {item['title']}"
                        for item in assignments
                    ],
                    args.json,
                )
                return
            if args.only:
                tasks = tuple(task for task in tasks if task_state(task) == args.only)
            if args.json:
                output(
                    [
                        {
                            "key": task.key,
                            "title": task.title,
                            "deadline": task.deadline.isoformat() if task.deadline else None,
                            "status": task.status,
                            "assignee": task.assignee,
                            "dependencies": task.dependencies,
                            "related": list(task.related),
                            "effort": task.effort,
                        }
                        for task in tasks
                    ],
                    True,
                )
            else:
                print("TASK | DEADLINE   | STATE     | ASSIGNEE     | TITLE")
                for task in tasks:
                    print(task_line(task))
            return

        if args.command == "bug":
            if args.bug_command == "list":
                reports = load_reports(args.csv)
                if args.bug_status:
                    reports = tuple(
                        report for report in reports if report.status == args.bug_status
                    )
                if args.json:
                    output([report.values for report in reports], True)
                else:
                    for report in reports:
                        print(
                            f"{report.report_id} | {report.status:16} | {report.values.get('summary', '')}"
                        )
                return
            if args.bug_command == "triage":
                triage_report(args.csv, args.report_id, args.status, args.lead_owner)
                output(f"Updated {args.report_id}: {args.status}")
                return
            if args.bug_command == "promote":
                if not args.yes:
                    raise GitHubError("Promoting a bug report writes a draft and requires --yes.")
                draft_path = promote_report(
                    args.csv, args.report_id, args.draft_directory, args.assignee, args.deadline
                )
                output(f"Created stamped draft task: {draft_path}")
                return

        if args.command == "report":
            # Reports are useful even without GitHub access, so auth is optional here.
            github, repository = {}, ""
            try:
                client = GitHubClient()
                repository = client.repository
                for issue in client.issues("all"):
                    if "pull_request" in issue:
                        continue
                    github[issue["number"]] = {
                        "state": issue.get("state", "open"),
                        "url": issue.get("html_url", ""),
                    }
            except GitHubError as exc:
                print(
                    f"Warning: GitHub unreachable ({exc}); exporting the planned view.",
                    file=sys.stderr,
                )
            report_data = build_report(args.draft_directory, github)
            generated_at = datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC")
            if args.json:
                output(report_data, True)
                return
            snapshot_path = Path(args.output).with_suffix(".snapshot.json")
            previous = load_snapshot(snapshot_path)
            entries = diff_reports(previous, report_data)
            baseline = previous.get("generated_at") if previous else None
            path = write_report_xlsx(
                args.output,
                report_data,
                generated_at=generated_at,
                repository=repository,
                changelog={"baseline": baseline, "entries": entries},
            )
            save_snapshot(snapshot_path, snapshot_for_report(report_data, generated_at, repository))
            print(f"Wrote {path}")
            summary = report_data["summary"]
            print(
                f"{summary['tasks']} tasks: {summary['planned']} planned, "
                f"{summary['open']} open, {summary['closed']} closed"
            )
            if baseline:
                print(f"Changelog: {len(entries)} change(s) since {baseline}")
            else:
                print("Changelog: no previous snapshot; baseline established")
            return

        client = GitHubClient()
        if args.command == "status":
            report = status_report(client, args.state)
            if args.json:
                output(report, True)
            else:
                print(f"{report['count']} {args.state} issue(s) in {client.repository}")
                for issue in report["issues"]:
                    print(issue_line(issue))
        elif args.command == "issue":
            if args.issue_command == "list":
                issues = [
                    issue for issue in client.issues(args.state) if "pull_request" not in issue
                ]
                output(issues if args.json else [issue_line(issue) for issue in issues], args.json)
            elif args.issue_command == "view":
                issue = client.issue(args.number)
                dependencies = client.list_dependencies(args.number)
                if args.json:
                    issue["blocked_by"] = dependencies
                    output(issue, True)
                else:
                    output(issue, args.json)
                    for dep in dependencies:
                        print(f"Blocked by #{dep['number']} {dep['title']}")
            elif args.issue_command == "create":
                body = args.body
                if args.deadline:
                    body = f"**Deadline:** {args.deadline}\n\n{body}".strip()
                output(client.create_issue(args.title, body, args.labels, args.assignee), args.json)
            elif args.issue_command == "edit":
                changes = {
                    key: value
                    for key, value in vars(args).items()
                    if key in ("title", "body", "state", "assignee") and value is not None
                }
                output(client.update_issue(args.number, **changes), args.json)
            elif args.issue_command == "close":
                if not args.yes:
                    raise GitHubError("Closing an issue requires --yes.")
                output(client.update_issue(args.number, state="closed"), args.json)
            elif args.issue_command == "comment":
                output(client.comment(args.number, args.body), args.json)
        elif args.command == "task":
            draft_path = Path(args.draft) if args.draft else None
            draft_task = None
            if draft_path:
                # --draft: build body from the clean draft sections, metadata goes to project fields
                body = args.body or draft_task_clean_body(draft_path)
            else:
                body = args.body
                if args.deadline:
                    body = f"**Deadline:** {args.deadline}\n\n{body}".strip()
            # Resolve relationship references from draft metadata and flags
            dependency_numbers = list(args.depends_on)
            related_numbers = list(args.related_to)
            unresolved = []
            if draft_path:
                draft_task = read_task(draft_path)
                metadata_deps, dep_unresolved = resolve_issue_stamps(
                    draft_path, draft_task.dependencies
                )
                metadata_related, rel_unresolved = resolve_issue_stamps(
                    draft_path, ", ".join(draft_task.related)
                )
                dependency_numbers.extend(metadata_deps)
                related_numbers.extend(metadata_related)
                unresolved = dep_unresolved + rel_unresolved
            if related_numbers:
                related_line = "**Related:** " + ", ".join(
                    f"#{number}" for number in dict.fromkeys(related_numbers)
                )
                body = f"{body}\n\n{related_line}" if body else related_line
            issue = client.create_issue(args.title, body, args.labels, args.assignee)
            output(issue, args.json)
            if draft_path:
                # Stamp the draft file with the issue reference
                update_task_reference(draft_path, issue["number"], issue["html_url"])
                print(f"Updated {draft_path} with issue #{issue['number']}")
                # Stamp project custom fields from draft metadata
                try:
                    fields = draft_task_to_project_fields(draft_task)
                    client.stamp_project_fields(issue["number"], fields)
                    field_summary = ", ".join(f"{k}={v}" for k, v in fields.items())
                    print(f"Set project fields: {field_summary}")
                except Exception as exc:
                    print(f"Warning: could not set project fields: {exc}")
                if unresolved:
                    print(
                        "Warning: unlinked dependencies (no GitHub Issue stamp): "
                        + ", ".join(unresolved)
                    )
            # Link native 'blocked by' relationships on GitHub
            for dep_number in dict.fromkeys(dependency_numbers):
                try:
                    blocking = client.issue(dep_number)
                    client.add_dependency(issue["number"], blocking["id"])
                    print(f"Linked #{issue['number']} as blocked by #{dep_number}")
                except GitHubError as exc:
                    print(f"Warning: could not link dependency #{dep_number}: {exc}")
        elif args.command == "deps":
            summary = deps_sync(client, args.draft_directory, args.dry_run)
            if args.json:
                output(summary, True)
            else:
                for entry in summary["results"]:
                    print(f"#{entry['issue']} {entry['title']}")
                    if entry["blocked_by"]:
                        print("  blocked by: " + ", ".join(f"#{n}" for n in entry["blocked_by"]))
                    if entry["related"]:
                        print("  related: " + ", ".join(f"#{n}" for n in entry["related"]))
                    if entry["skipped"]:
                        print("  skipped (unstamped drafts): " + ", ".join(entry["skipped"]))
                verb = "Would link" if args.dry_run else "Linked"
                print(
                    f"{verb} {summary['linked']} blocked-by relationship(s), "
                    f"updated {summary['related_updated']} Related line(s)"
                )
        elif args.command == "project":
            output(client.project_overview(), args.json)
        elif args.command == "pr":
            prs = client.pull_requests(args.state)
            output(prs if args.json else [issue_line(pr) for pr in prs], args.json)
        elif args.command == "labels":
            for name in OBSOLETE_CUSTOM_FIELD_LABELS:
                with contextlib.suppress(GitHubError):
                    client.delete_label(name)
            for name, color, description in LABELS:
                with contextlib.suppress(GitHubError):
                    client.create_label(name, color, description)
            output(
                f"Synchronized {len(LABELS)} labels; status and priority remain project custom fields."
            )
    except (GitHubError, ValueError) as error:
        print(f"Error: {error}", file=sys.stderr)
        raise SystemExit(1) from error
