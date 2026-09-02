import argparse
import contextlib
import json
import sys
from pathlib import Path

from .bug_reports import load_reports, promote_report, triage_report
from .github import GitHubClient, GitHubError
from .planner import (
    KICKOFF_ASSIGNMENTS,
    ROLE_TO_USER,
    draft_task_clean_body,
    draft_task_to_project_fields,
    load_tasks,
    read_task,
    schedule_warnings,
    task_line,
    task_state,
    update_task_reference,
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


def build_parser():
    parser = argparse.ArgumentParser(prog="project-management")
    parser.add_argument("--json", action="store_true", help="Print machine-readable output.")
    commands = parser.add_subparsers(dest="command", required=True)

    status = commands.add_parser("status", help="Show issues and project custom-field status.")
    status.add_argument("--state", choices=("open", "closed", "all"), default="open")

    plan = commands.add_parser("plan", help="Review the local project plan.")
    plan_commands = plan.add_subparsers(dest="plan_command", required=True)
    plan_show = plan_commands.add_parser(
        "show", help="Show tasks, deadlines, and assignments."
    )
    plan_show.add_argument("--directory", default="docs/draft_tasks")
    plan_show.add_argument("--only", choices=("unassigned", "overdue", "planned", "done"))
    kickoff = plan_commands.add_parser("kickoff", help="Show the recommended four-person task split.")
    kickoff.add_argument("--directory", default="docs/draft_tasks")
    check = plan_commands.add_parser("check", help="Warn about schedule collisions and dependency problems.")
    check.add_argument("--directory", default="docs/draft_tasks")

    bug = commands.add_parser("bug", help="Review and promote raw bug reports.")
    bug_commands = bug.add_subparsers(dest="bug_command", required=True)
    bug_list = bug_commands.add_parser("list", help="List raw bug reports.")
    bug_list.add_argument("--csv", default="docs/bug-reports.csv")
    bug_list.add_argument("--status", dest="bug_status")
    triage = bug_commands.add_parser("triage", help="Set a report's lead triage status.")
    triage.add_argument("report_id")
    triage.add_argument("--status", required=True, choices=("untriaged", "accepted", "duplicate", "not-reproducible", "expected-behavior", "in-progress", "verified", "closed"))
    triage.add_argument("--lead-owner")
    triage.add_argument("--csv", default="docs/bug-reports.csv")
    promote = bug_commands.add_parser("promote", help="Convert an accepted report into a stamped draft task.")
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


def main():
    args = build_parser().parse_args()
    try:
        if args.command == "plan":
            tasks = load_tasks(args.directory)
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
                    }
                    for task in tasks
                ]
                output(assignments if args.json else [
                    f"{item['key']} | {item['deadline'] or 'no deadline'} | {item['assignee']:20} | {item['title']}"
                    for item in assignments
                ], args.json)
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
                    reports = tuple(report for report in reports if report.status == args.bug_status)
                if args.json:
                    output([report.values for report in reports], True)
                else:
                    for report in reports:
                        print(f"{report.report_id} | {report.status:16} | {report.values.get('summary', '')}")
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
                issues = [issue for issue in client.issues(args.state) if "pull_request" not in issue]
                output(issues if args.json else [issue_line(issue) for issue in issues], args.json)
            elif args.issue_command == "view":
                output(client.issue(args.number), args.json)
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
            if args.draft:
                # --draft: build body from the clean draft sections, metadata goes to project fields
                draft_path = Path(args.draft)
                body = args.body or draft_task_clean_body(draft_path)
            else:
                body = args.body
                if args.deadline:
                    body = f"**Deadline:** {args.deadline}\n\n{body}".strip()
            issue = client.create_issue(args.title, body, args.labels, args.assignee)
            output(issue, args.json)
            if args.draft:
                # Stamp the draft file with the issue reference
                update_task_reference(draft_path, issue["number"], issue["html_url"])
                print(f"Updated {draft_path} with issue #{issue['number']}")
                # Stamp project custom fields from draft metadata
                try:
                    task = read_task(draft_path)
                    fields = draft_task_to_project_fields(task)
                    client.stamp_project_fields(issue["number"], fields)
                    field_summary = ", ".join(f"{k}={v}" for k, v in fields.items())
                    print(f"Set project fields: {field_summary}")
                except Exception as exc:
                    print(f"Warning: could not set project fields: {exc}")
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
