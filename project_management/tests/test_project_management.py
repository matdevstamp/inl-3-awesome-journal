"""Comprehensive tests for the project_management package.

Run with:  python -m pytest tests/ -v
       or:  python -m unittest tests.test_project_management -v
"""

import json
import tempfile
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import MagicMock, patch

from ..cli import (
    OBSOLETE_CUSTOM_FIELD_LABELS,
    build_parser,
    issue_line,
    output,
    status_report,
)
from ..github import GitHubClient, GitHubError
from ..planner import (
    KICKOFF_ASSIGNMENTS,
    TEAM_MEMBERS,
    Task,
    draft_task_clean_body,
    draft_task_to_project_fields,
    gantt_unscheduled,
    load_tasks,
    parse_task_refs,
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

# ── Helpers ──────────────────────────────────────────────────────────────────


def _make_task(**overrides):
    """Build a Task with sensible defaults, overriding only what you need."""
    defaults = dict(
        key="01",
        title="Test task",
        deadline=date(2026, 9, 4),
        status="TODO",
        assignee="TBD",
        tags=("type:feature",),
        dependencies="None",
        related=(),
        effort="2h",
        path=Path("/fake/01-test.md"),
    )
    defaults.update(overrides)
    return Task(**defaults)


SAMPLE_DRAFT = """\
# Task: Sample Task

## Metadata
- **Priority:** P0 - Critical
- **Deadline:** 2026-09-10
- **Status:** TODO
- **Assignee:** Person 1
- **Tags:** type:feature, gate:3-features, stream:A-identity
- **Dependencies:** 01-project-setup-group-contract.md
- **Related:** 02-database-choice-discussion.md
- **Estimated Effort:** 6h

## Requirements
- Must do the thing
- Must also do the other thing

## User Stories
- As a user, I want X so that Y

## Design
Some design notes here.

## Tasks
- [ ] Do the thing
- [ ] Do the other thing

## Done Criteria
- [ ] Thing is done
- [ ] Other thing is done

## Notes
- Keep it simple
"""


# ── Planner: read_task ───────────────────────────────────────────────────────


class TestReadTask(unittest.TestCase):
    """Tests for read_task() — parsing markdown draft files."""

    def _write_draft(self, tmp, filename, content):
        path = Path(tmp) / filename
        path.write_text(content)
        return path

    def test_parses_metadata_fields(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = self._write_draft(tmp, "01-sample.md", SAMPLE_DRAFT)
            task = read_task(path)

        self.assertEqual(task.key, "01")
        self.assertEqual(task.title, "Sample Task")
        self.assertEqual(task.deadline, date(2026, 9, 10))
        self.assertEqual(task.status, "TODO")
        self.assertEqual(task.assignee, "Person 1")
        self.assertIn("type:feature", task.tags)
        self.assertIn("gate:3-features", task.tags)
        self.assertIn("stream:A-identity", task.tags)
        self.assertEqual(task.dependencies, "01-project-setup-group-contract.md")
        self.assertEqual(task.effort, "6h")

    def test_key_extracted_from_filename(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = self._write_draft(tmp, "14-medical-notes.md", SAMPLE_DRAFT)
            task = read_task(path)
        self.assertEqual(task.key, "14")

    def test_missing_title_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = self._write_draft(tmp, "01-no-title.md", "No title here\n")
            with self.assertRaises(ValueError):
                read_task(path)

    def test_parses_related_metadata(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = self._write_draft(tmp, "01-sample.md", SAMPLE_DRAFT)
            task = read_task(path)
        self.assertEqual(task.related, ("02-database-choice-discussion.md",))

    def test_defaults_for_missing_metadata(self):
        content = "# Task: Minimal\n\n## Requirements\n- stuff\n"
        with tempfile.TemporaryDirectory() as tmp:
            path = self._write_draft(tmp, "99-minimal.md", content)
            task = read_task(path)

        self.assertIsNone(task.deadline)
        self.assertEqual(task.status, "TODO")
        self.assertEqual(task.assignee, "TBD")
        self.assertEqual(task.tags, ())
        self.assertEqual(task.dependencies, "None")
        self.assertEqual(task.related, ())
        self.assertEqual(task.effort, "unspecified")


# ── Planner: load_tasks ──────────────────────────────────────────────────────


class TestLoadTasks(unittest.TestCase):
    def test_loads_all_draft_tasks(self):
        tasks = load_tasks("docs/draft_tasks")
        self.assertGreaterEqual(len(tasks), 21)

    def test_tasks_are_sorted_by_key(self):
        tasks = load_tasks("docs/draft_tasks")
        keys = [t.key for t in tasks]
        self.assertEqual(keys, sorted(keys))

    def test_all_tasks_have_titles(self):
        tasks = load_tasks("docs/draft_tasks")
        for task in tasks:
            self.assertTrue(task.title, f"Task {task.key} has empty title")


# ── Planner: task_state ──────────────────────────────────────────────────────


class TestTaskState(unittest.TestCase):
    def test_done_status(self):
        task = _make_task(status="DONE")
        self.assertEqual(task_state(task, date(2026, 9, 4)), "done")

    def test_completed_status(self):
        task = _make_task(status="COMPLETED")
        self.assertEqual(task_state(task, date(2026, 9, 4)), "done")

    def test_overdue(self):
        task = _make_task(deadline=date(2026, 9, 3), assignee="Kassim10")
        self.assertEqual(task_state(task, date(2026, 9, 4)), "overdue")

    def test_unassigned_team(self):
        task = _make_task(assignee="Team")
        self.assertEqual(task_state(task, date(2026, 9, 4)), "unassigned")

    def test_unassigned_tbd(self):
        task = _make_task(assignee="TBD")
        self.assertEqual(task_state(task, date(2026, 9, 4)), "unassigned")

    def test_planned(self):
        task = _make_task(assignee="Kassim10", deadline=date(2026, 9, 10))
        self.assertEqual(task_state(task, date(2026, 9, 4)), "planned")

    def test_no_deadline_not_overdue(self):
        task = _make_task(deadline=None, assignee="Kassim10")
        self.assertEqual(task_state(task, date(2099, 1, 1)), "planned")


# ── Planner: task_line ───────────────────────────────────────────────────────


class TestTaskLine(unittest.TestCase):
    def test_format_includes_key_deadline_state_assignee_title(self):
        task = _make_task(
            key="05", deadline=date(2026, 9, 6), assignee="Person 2", title="Vite Setup"
        )
        line = task_line(task, today=date(2026, 9, 4))
        self.assertIn("05", line)
        self.assertIn("2026-09-06", line)
        self.assertIn("planned", line)
        self.assertIn("Person 2", line)
        self.assertIn("Vite Setup", line)

    def test_no_deadline(self):
        task = _make_task(deadline=None, assignee="Kassim10")
        line = task_line(task)
        self.assertIn("no deadline", line)


# ── Planner: schedule_warnings ───────────────────────────────────────────────


class TestScheduleWarnings(unittest.TestCase):
    def test_duplicate_deadline(self):
        tasks = [
            _make_task(key="01", deadline=date(2026, 9, 4), title="First"),
            _make_task(key="02", deadline=date(2026, 9, 4), title="Second"),
        ]
        warnings = schedule_warnings(tasks)
        self.assertEqual(len(warnings), 1)
        self.assertIn("Duplicate deadline", warnings[0])

    def test_no_warnings_for_unique_deadlines(self):
        tasks = [
            _make_task(key="01", deadline=date(2026, 9, 4)),
            _make_task(key="02", deadline=date(2026, 9, 5)),
        ]
        warnings = schedule_warnings(tasks)
        self.assertEqual(len(warnings), 0)

    def test_dependency_deadline_violation(self):
        """Task 02 depends on 01, but 02 is due before 01."""
        tasks = [
            _make_task(key="01", deadline=date(2026, 9, 10), title="Prereq"),
            _make_task(
                key="02", deadline=date(2026, 9, 5), dependencies="01-prereq.md", title="Dependent"
            ),
        ]
        warnings = schedule_warnings(tasks)
        deadline_warnings = [w for w in warnings if "violation" in w.lower()]
        self.assertGreaterEqual(len(deadline_warnings), 1)

    def test_no_violation_when_order_correct(self):
        tasks = [
            _make_task(key="01", deadline=date(2026, 9, 4), title="Prereq"),
            _make_task(
                key="02", deadline=date(2026, 9, 10), dependencies="01-prereq.md", title="Dependent"
            ),
        ]
        warnings = schedule_warnings(tasks)
        self.assertEqual(len(warnings), 0)


# ── Planner: update_task_reference ───────────────────────────────────────────


class TestUpdateTaskReference(unittest.TestCase):
    def _write_draft(self, tmp, content):
        path = Path(tmp) / "01-test.md"
        path.write_text(content)
        return path

    def test_stamps_new_reference(self):
        content = (
            "## Metadata\n"
            "- **Estimated Effort:** 2h\n"
            "- **Dependencies:** None\n"
            "\n## Requirements\n- stuff\n"
        )
        with tempfile.TemporaryDirectory() as tmp:
            path = self._write_draft(tmp, content)
            update_task_reference(path, 42, "https://github.com/test/repo/issues/42")
            result = path.read_text()

        self.assertIn("- **GitHub Issue:** #42 (https://github.com/test/repo/issues/42)", result)
        # Should not have duplicate
        self.assertEqual(result.count("GitHub Issue:"), 1)

    def test_replaces_existing_reference(self):
        content = (
            "## Metadata\n"
            "- **Estimated Effort:** 2h\n"
            "- **GitHub Issue:** #10 (https://old/url)\n"
            "\n## Requirements\n- stuff\n"
        )
        with tempfile.TemporaryDirectory() as tmp:
            path = self._write_draft(tmp, content)
            update_task_reference(path, 99, "https://github.com/new/repo/issues/99")
            result = path.read_text()

        self.assertNotIn("#10", result)
        self.assertIn("#99", result)
        self.assertEqual(result.count("GitHub Issue:"), 1)

    def test_no_stray_control_characters(self):
        content = (
            "## Metadata\n"
            "- **Estimated Effort:** 2h\n"
            "- **Dependencies:** None\n"
            "\n## Requirements\n- stuff\n"
        )
        with tempfile.TemporaryDirectory() as tmp:
            path = self._write_draft(tmp, content)
            update_task_reference(path, 1, "https://test/url")
            raw = path.read_bytes()

        self.assertNotIn(b"\x01", raw)


# ── Planner: draft_task_to_project_fields ────────────────────────────────────


class TestDraftTaskToProjectFields(unittest.TestCase):
    def test_basic_fields(self):
        task = _make_task(effort="2h", deadline=date(2026, 9, 5), tags=("type:feature",))
        fields = draft_task_to_project_fields(task)
        self.assertEqual(fields["Priority"], "P0")
        self.assertEqual(fields["Size"], "S")
        self.assertEqual(fields["Estimate"], "2")
        self.assertEqual(fields["Target date"], "2026-09-05")
        self.assertNotIn("Status", fields)  # not set automatically

    def test_effort_mappings(self):
        cases = [
            ("1h", "P0", "XS", "1"),
            ("2h", "P0", "S", "2"),
            ("3h", "P1", "S", "3"),
            ("4h", "P1", "M", "4"),
            ("6h", "P1", "M", "6"),
            ("8h", "P2", "L", "8"),
            ("12h", "P0", "M", "12"),  # unmapped → default P0, M
        ]
        for effort, exp_priority, exp_size, exp_estimate in cases:
            task = _make_task(effort=effort)
            fields = draft_task_to_project_fields(task)
            self.assertEqual(
                fields["Priority"], exp_priority, f"Priority wrong for effort={effort}"
            )
            self.assertEqual(fields["Size"], exp_size, f"Size wrong for effort={effort}")
            self.assertEqual(
                fields["Estimate"], exp_estimate, f"Estimate wrong for effort={effort}"
            )

    def test_gate_from_tags(self):
        task = _make_task(tags=("type:feature", "gate:3-features"))
        fields = draft_task_to_project_fields(task)
        self.assertEqual(fields["Gate"], "3-Features")

    def test_stream_from_tags(self):
        task = _make_task(tags=("stream:D-audit",))
        fields = draft_task_to_project_fields(task)
        self.assertEqual(fields["Stream"], "D-Audit")

    def test_no_deadline_no_target_date(self):
        task = _make_task(deadline=None)
        fields = draft_task_to_project_fields(task)
        self.assertNotIn("Target date", fields)

    def test_no_estimate_for_unspecified_effort(self):
        task = _make_task(effort="unspecified")
        fields = draft_task_to_project_fields(task)
        self.assertNotIn("Estimate", fields)


# ── Planner: draft_task_clean_body ───────────────────────────────────────────


class TestDraftTaskCleanBody(unittest.TestCase):
    def test_strips_metadata_section(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "01-test.md"
            path.write_text(SAMPLE_DRAFT)
            body = draft_task_clean_body(path)

        self.assertNotIn("Deadline:", body)
        self.assertNotIn("Assignee:", body)
        self.assertNotIn("Estimated Effort:", body)
        self.assertNotIn("Priority:", body)

    def test_keeps_requirements_and_tasks(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "01-test.md"
            path.write_text(SAMPLE_DRAFT)
            body = draft_task_clean_body(path)

        self.assertIn("## Requirements", body)
        self.assertIn("Must do the thing", body)
        self.assertIn("## Tasks", body)
        self.assertIn("## Done Criteria", body)

    def test_strips_design_and_notes(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "01-test.md"
            path.write_text(SAMPLE_DRAFT)
            body = draft_task_clean_body(path)

        self.assertNotIn("## Design", body)
        self.assertNotIn("## Notes", body)
        self.assertNotIn("## User Stories", body)

    def test_no_excessive_blank_lines(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "01-test.md"
            path.write_text(SAMPLE_DRAFT)
            body = draft_task_clean_body(path)

        self.assertNotIn("\n\n\n", body)


# ── CLI: status_report ──────────────────────────────────────────────────────


class TestStatusReport(unittest.TestCase):
    def test_excludes_pull_requests(self):
        client = MagicMock()
        client.repository = "test/repo"
        client.issues.return_value = [
            {"number": 1, "title": "Issue", "state": "open"},
            {
                "number": 2,
                "title": "PR",
                "state": "open",
                "pull_request": {"url": "https://api.github.com/pulls/2"},
            },
        ]
        report = status_report(client, "open")
        self.assertEqual(report["count"], 1)
        self.assertEqual(report["issues"][0]["number"], 1)

    def test_empty_state(self):
        client = MagicMock()
        client.repository = "test/repo"
        client.issues.return_value = []
        report = status_report(client, "open")
        self.assertEqual(report["count"], 0)


# ── CLI: issue_line ─────────────────────────────────────────────────────────


class TestIssueLine(unittest.TestCase):
    def test_format_with_labels(self):
        issue = {
            "number": 5,
            "title": "Test issue",
            "state": "open",
            "html_url": "https://github.com/test/repo/issues/5",
            "labels": [{"name": "type:bug"}, {"name": "gate:1-decisions"}],
        }
        line = issue_line(issue)
        self.assertIn("#5", line)
        self.assertIn("Test issue", line)
        self.assertIn("open", line)
        self.assertIn("type:bug", line)
        self.assertIn("gate:1-decisions", line)
        self.assertIn("https://github.com", line)

    def test_format_without_labels(self):
        issue = {
            "number": 1,
            "title": "Bare issue",
            "state": "closed",
            "html_url": "https://github.com/test/repo/issues/1",
            "labels": [],
        }
        line = issue_line(issue)
        self.assertNotIn("[", line)


# ── CLI: output ─────────────────────────────────────────────────────────────


class TestOutput(unittest.TestCase):
    def test_json_output(self):
        data = {"key": "value"}
        with patch("builtins.print") as mock_print:
            output(data, as_json=True)
            printed = mock_print.call_args[0][0]
        parsed = json.loads(printed)
        self.assertEqual(parsed, data)

    def test_list_output(self):
        items = ["line1", "line2"]
        with patch("builtins.print") as mock_print:
            output(items, as_json=False)
            calls = [c[0][0] for c in mock_print.call_args_list]
        self.assertEqual(calls, ["line1", "line2"])


# ── CLI: build_parser ───────────────────────────────────────────────────────


class TestBuildParser(unittest.TestCase):
    def test_status_command(self):
        parser = build_parser()
        args = parser.parse_args(["status"])
        self.assertEqual(args.command, "status")
        self.assertEqual(args.state, "open")

    def test_plan_show(self):
        parser = build_parser()
        args = parser.parse_args(["plan", "show"])
        self.assertEqual(args.command, "plan")
        self.assertEqual(args.plan_command, "show")

    def test_task_create_with_draft(self):
        parser = build_parser()
        args = parser.parse_args(
            [
                "task",
                "create",
                "--title",
                "Test",
                "--draft",
                "docs/draft_tasks/01-test.md",
            ]
        )
        self.assertEqual(args.draft, "docs/draft_tasks/01-test.md")

    def test_issue_create_with_labels(self):
        parser = build_parser()
        args = parser.parse_args(
            [
                "issue",
                "create",
                "--title",
                "Bug",
                "--label",
                "type:bug",
                "--label",
                "gate:1-decisions",
            ]
        )
        self.assertEqual(args.labels, ["type:bug", "gate:1-decisions"])

    def test_json_flag(self):
        parser = build_parser()
        args = parser.parse_args(["--json", "status"])
        self.assertTrue(args.json)


# ── GitHub: GitHubClient ─────────────────────────────────────────────────────


class TestGitHubClient(unittest.TestCase):
    @patch.dict("os.environ", {"GITHUB_TOKEN": "test-token", "GITHUB_REPOSITORY": "test/repo"})
    def test_uses_env_token(self):
        client = GitHubClient()
        self.assertEqual(client.token, "test-token")
        self.assertEqual(client.repository, "test/repo")

    @patch.dict("os.environ", {}, clear=True)
    @patch("project_management.github.subprocess.run")
    def test_falls_back_to_gh_cli(self, mock_run):
        mock_run.return_value = MagicMock(returncode=0, stdout="gho_from_cli\n")
        client = GitHubClient()
        self.assertEqual(client.token, "gho_from_cli")

    @patch.dict("os.environ", {}, clear=True)
    @patch("project_management.github.subprocess.run", side_effect=FileNotFoundError)
    def test_raises_when_no_token(self, mock_run):
        with self.assertRaises(GitHubError):
            GitHubClient()

    @patch.dict("os.environ", {"GITHUB_TOKEN": "tok", "GITHUB_REPOSITORY": "a/b"})
    @patch("project_management.github.urlopen")
    def test_request_builds_correct_url(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.read.return_value = b'{"ok": true}'
        mock_response.__enter__ = lambda s: s
        mock_response.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_response

        client = GitHubClient()
        client.request("GET", "/issues")

        call_args = mock_urlopen.call_args[0][0]
        self.assertEqual(call_args.full_url, "https://api.github.com/repos/a/b/issues")
        self.assertEqual(call_args.method, "GET")

    @patch.dict("os.environ", {"GITHUB_TOKEN": "tok", "GITHUB_REPOSITORY": "a/b"})
    @patch("project_management.github.urlopen")
    def test_request_sends_json_payload(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.read.return_value = b'{"number": 1}'
        mock_response.__enter__ = lambda s: s
        mock_response.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_response

        client = GitHubClient()
        client.request("POST", "/issues", {"title": "Test"})

        call_args = mock_urlopen.call_args[0][0]
        self.assertEqual(call_args.method, "POST")
        self.assertIn(b"Test", call_args.data)

    @patch.dict("os.environ", {"GITHUB_TOKEN": "tok", "GITHUB_REPOSITORY": "a/b"})
    @patch("project_management.github.urlopen")
    def test_request_raises_on_http_error(self, mock_urlopen):
        from urllib.error import HTTPError

        mock_urlopen.side_effect = HTTPError(
            url="https://api.github.com",
            code=404,
            msg="Not Found",
            hdrs=None,
            fp=MagicMock(read=MagicMock(return_value=b'{"message":"not found"}')),
        )
        client = GitHubClient()
        with self.assertRaises(GitHubError) as ctx:
            client.request("GET", "/issues/999")
        self.assertIn("404", str(ctx.exception))

    @patch.dict("os.environ", {"GITHUB_TOKEN": "tok", "GITHUB_REPOSITORY": "a/b"})
    @patch("project_management.github.urlopen")
    def test_graphql_extracts_errors(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps(
            {"errors": [{"message": "Something went wrong"}]}
        ).encode()
        mock_response.__enter__ = lambda s: s
        mock_response.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_response

        client = GitHubClient()
        with self.assertRaises(GitHubError) as ctx:
            client.graphql("{ bad query }")
        self.assertIn("Something went wrong", str(ctx.exception))


# ── GitHub: label helpers ────────────────────────────────────────────────────


class TestLabelHelpers(unittest.TestCase):
    def test_obsolete_labels_include_priority_and_status(self):
        self.assertIn("P0-critical", OBSOLETE_CUSTOM_FIELD_LABELS)
        self.assertIn("P1-high", OBSOLETE_CUSTOM_FIELD_LABELS)
        self.assertIn("status:todo", OBSOLETE_CUSTOM_FIELD_LABELS)
        self.assertIn("status:done", OBSOLETE_CUSTOM_FIELD_LABELS)

    def test_obsolete_labels_count(self):
        # 4 priority + 5 status = 9
        self.assertEqual(len(OBSOLETE_CUSTOM_FIELD_LABELS), 9)


# ── Planner: constants ──────────────────────────────────────────────────────


class TestConstants(unittest.TestCase):
    def test_kickoff_assignments_covers_all_tasks(self):
        for i in range(1, 22):
            key = f"{i:02d}"
            self.assertIn(key, KICKOFF_ASSIGNMENTS, f"Task {key} missing from KICKOFF_ASSIGNMENTS")

    def test_team_members_has_all_users(self):
        expected = {"matdevstamp", "Kassim10", "rcilomba", "umoraghad0-del"}
        self.assertEqual(set(TEAM_MEMBERS.keys()), expected)


# ── Planner: task refs and issue stamps ─────────────────────────────────────


class TestTaskRefsAndStamps(unittest.TestCase):
    def _write(self, tmp, name, content):
        path = Path(tmp) / name
        path.write_text(content, encoding="utf-8")
        return path

    def test_parse_task_refs_extracts_files_and_keys(self):
        refs = parse_task_refs(
            "01-project-setup-group-contract.md, 02-db.md; final update depends on all tasks 03-x.md"
        )
        self.assertEqual(
            refs,
            [
                ("01", "01-project-setup-group-contract.md"),
                ("02", "02-db.md"),
                ("03", "03-x.md"),
            ],
        )

    def test_parse_task_refs_none_or_empty(self):
        self.assertEqual(parse_task_refs("None"), [])
        self.assertEqual(parse_task_refs(""), [])

    def test_resolve_issue_stamps_reads_sibling_stamps(self):
        with tempfile.TemporaryDirectory() as tmp:
            prereq = self._write(
                tmp,
                "01-prereq.md",
                "# Task: Prereq\n## Metadata\n- **GitHub Issue:** #1 (url)\n",
            )
            dependent = self._write(tmp, "02-dependent.md", "# Task: Dependent\n")
            numbers, unresolved = resolve_issue_stamps(dependent, "01-prereq.md")
            self.assertEqual(numbers, [1])
            self.assertEqual(unresolved, [])
            # Missing / unstamped references land in unresolved
            numbers, unresolved = resolve_issue_stamps(dependent, "01-prereq.md, 99-missing.md")
            self.assertEqual(numbers, [1])
            self.assertEqual(unresolved, ["99-missing.md"])
            numbers, unresolved = resolve_issue_stamps(prereq, "None")
            self.assertEqual((numbers, unresolved), ([], []))
            # Dependency file exists but has no stamp yet
            numbers, unresolved = resolve_issue_stamps(prereq, "02-dependent.md")
            self.assertEqual(numbers, [])
            self.assertEqual(unresolved, ["02-dependent.md"])

    def test_task_issue_stamp(self):
        with tempfile.TemporaryDirectory() as tmp:
            stamped = self._write(tmp, "01-a.md", "# Task: A\n- **GitHub Issue:** #7 (url)\n")
            plain = self._write(tmp, "02-b.md", "# Task: B\n")
            self.assertEqual(task_issue_stamp(stamped), 7)
            self.assertIsNone(task_issue_stamp(plain))

    def test_update_related_line_appends_and_replaces(self):
        body = "## Requirements\n- do stuff\n"
        updated = update_related_line(body, [2, 3])
        self.assertIn("**Related:** #2, #3", updated)
        # Idempotent: second call yields the same body
        self.assertEqual(update_related_line(updated, [2, 3]), updated)
        # Replaces an existing line
        replaced = update_related_line("**Related:** #9\n\nBody text", [4])
        self.assertIn("**Related:** #4", replaced)
        self.assertNotIn("#9", replaced)
        self.assertIn("Body text", replaced)


# ── Planner: task_graph_mermaid ──────────────────────────────────────────────


class TestTaskGraphMermaid(unittest.TestCase):
    def test_dependency_arrow_and_related_dotted(self):
        tasks = [
            _make_task(key="01", title="Contract", tags=("gate:1-decisions",)),
            _make_task(
                key="02",
                title="DB choice",
                tags=("gate:1-decisions",),
                dependencies="01-project-setup-group-contract.md",
            ),
            _make_task(
                key="03",
                title="Artifacts",
                tags=("gate:1-decisions",),
                related=("01-project-setup-group-contract.md",),
            ),
        ]
        graph = task_graph_mermaid(tasks)
        # Node labels carry checkbox progress + status (fixture path is missing -> 0/0).
        self.assertIn('T01["01 Contract (0/0 · todo)"]', graph)
        self.assertIn("T01 --> T02", graph)
        self.assertIn("T01 -. related .- T03", graph)

    def test_related_edge_skipped_when_already_dependency(self):
        tasks = [
            _make_task(key="01", title="Prereq"),
            _make_task(key="02", title="Dependent", dependencies="01-x.md", related=("01-x.md",)),
        ]
        graph = task_graph_mermaid(tasks)
        self.assertIn("T01 --> T02", graph)
        self.assertNotIn("T01 -. related .- T02", graph)

    def test_prose_in_dependencies_is_ignored(self):
        tasks = [
            _make_task(key="01", title="Contract"),
            _make_task(
                key="20",
                title="Docs",
                dependencies="01-x.md; final update depends on all implementation tasks",
            ),
        ]
        graph = task_graph_mermaid(tasks)
        self.assertIn("T01 --> T20", graph)

    def test_gate_subgraphs(self):
        tasks = [
            _make_task(key="01", title="Contract", tags=("gate:1-decisions",)),
            _make_task(key="12", title="Frontend UI", tags=("gate:3-features",)),
        ]
        graph = task_graph_mermaid(tasks)
        self.assertIn('subgraph decisions["Gate 1-Decisions"]', graph)
        self.assertIn('subgraph features["Gate 3-Features"]', graph)

    def test_status_colors_and_done_check(self):
        tasks = [
            _make_task(key="01", title="Prereq done", status="DONE"),
            _make_task(key="02", title="Working now", status="IN PROGRESS"),
            _make_task(key="03", title="Later task", status="TODO"),
        ]
        graph = task_graph_mermaid(tasks)
        self.assertIn('T01["01 Prereq done ✓"]', graph)
        self.assertIn('T02["02 Working now (0/0 · doing)"]', graph)
        self.assertIn('T03["03 Later task (0/0 · todo)"]', graph)
        self.assertIn("class T01 done;", graph)
        self.assertIn("class T02 doing;", graph)
        self.assertIn("class T03 todo;", graph)

    def test_classdef_uses_mermaid_11_space_syntax(self):
        graph = task_graph_mermaid([_make_task(key="01", title="X")])
        self.assertIn("classDef done fill:#dcedc8,stroke:#558b2f,color:#1b5e20", graph)
        self.assertIn("classDef doing fill:#dbe9fb,stroke:#1565c0,color:#0d47a1", graph)
        self.assertIn("classDef todo fill:#ffffff,stroke:#b0bec5", graph)
        # The legacy `classDef name,fill:…` form must never come back (parse error).
        self.assertNotIn("classDef done,", graph)
        self.assertNotIn("classDef doing,", graph)
        self.assertNotIn("classDef todo,", graph)

    def test_progress_counts_checkboxes_from_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "01-progress.md"
            path.write_text(
                "# Task: Progress\n\n## Tasks\n- [x] a\n- [x] b\n- [ ] c\n- [ ] d\n"
            )
            task = _make_task(key="01", title="Progress", path=path)
            graph = task_graph_mermaid([task])
        self.assertIn('T01["01 Progress (50% · 2/4 · todo)"]', graph)


# ── Planner: task_gantt_mermaid ─────────────────────────────────────────────


class TestTaskGanttMermaid(unittest.TestCase):
    def test_gate_sections_and_done_state(self):
        tasks = [
            _make_task(
                key="01",
                title="Contract",
                status="DONE",
                deadline=date(2026, 9, 10),
                effort="2h",
                tags=("gate:1-decisions",),
            ),
            _make_task(
                key="02",
                title="DB choice",
                deadline=date(2026, 9, 12),
                effort="4h",
                tags=("gate:1-decisions",),
            ),
        ]
        chart = task_gantt_mermaid(tasks)
        self.assertIn("section Gate 1-Decisions", chart)
        # Done task: ✓ label + mermaid done state.
        self.assertIn("01 Contract ✓ : done, 2026-09-10, 1d", chart)
        # Open task: same label design with progress + status; effort 4h -> 1 day.
        self.assertIn("02 DB choice (0/0 · todo) : active, 2026-09-12, 1d", chart)

    def test_undated_task_omitted_from_chart(self):
        """Undated tasks must not produce `: skipped, 0d` rows (mermaid render error)."""
        tasks = [
            _make_task(key="04", title="Dated anchor", deadline=date(2026, 9, 12), effort="2h"),
            _make_task(key="05", title="No deadline", deadline=None, effort="3h"),
        ]
        chart = task_gantt_mermaid(tasks)
        self.assertNotIn("skipped", chart)
        self.assertIn("04 Dated anchor (0/0 · todo) : active, 2026-09-12, 1d", chart)
        # … and the unscheduled helper reports it for the doc note.
        self.assertEqual(gantt_unscheduled(tasks), ["05"])

    def test_no_dates_short_circuit(self):
        task = _make_task(key="05", title="No deadline", deadline=None)
        chart = task_gantt_mermaid([task])
        self.assertTrue(chart.startswith("gantt"))
        self.assertIn("no dates", chart)
        self.assertEqual(gantt_unscheduled([task]), ["05"])

    def test_colon_in_title_sanitized_for_gantt(self):
        task = _make_task(
            key="07", title="Flow: decide next", deadline=date(2026, 9, 12), effort="2h"
        )
        chart = task_gantt_mermaid([task])
        # Unquoted gantt labels split on ':' — the date parser must see only one.
        self.assertIn("07 Flow- decide next (0/0 · todo) : active, 2026-09-12, 1d", chart)
        self.assertNotIn("Flow: decide", chart)


if __name__ == "__main__":
    unittest.main()
