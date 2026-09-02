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
    load_tasks,
    read_task,
    schedule_warnings,
    task_line,
    task_state,
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
        task = _make_task(key="05", deadline=date(2026, 9, 6), assignee="Person 2",
                          title="Vite Setup")
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
            _make_task(key="02", deadline=date(2026, 9, 5),
                       dependencies="01-prereq.md", title="Dependent"),
        ]
        warnings = schedule_warnings(tasks)
        deadline_warnings = [w for w in warnings if "violation" in w.lower()]
        self.assertGreaterEqual(len(deadline_warnings), 1)

    def test_no_violation_when_order_correct(self):
        tasks = [
            _make_task(key="01", deadline=date(2026, 9, 4), title="Prereq"),
            _make_task(key="02", deadline=date(2026, 9, 10),
                       dependencies="01-prereq.md", title="Dependent"),
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
        task = _make_task(effort="2h", deadline=date(2026, 9, 5),
                          tags=("type:feature",))
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
            self.assertEqual(fields["Priority"], exp_priority,
                             f"Priority wrong for effort={effort}")
            self.assertEqual(fields["Size"], exp_size,
                             f"Size wrong for effort={effort}")
            self.assertEqual(fields["Estimate"], exp_estimate,
                             f"Estimate wrong for effort={effort}")

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
            {"number": 2, "title": "PR", "state": "open",
             "pull_request": {"url": "https://api.github.com/pulls/2"}},
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
        args = parser.parse_args([
            "task", "create",
            "--title", "Test",
            "--draft", "docs/draft_tasks/01-test.md",
        ])
        self.assertEqual(args.draft, "docs/draft_tasks/01-test.md")

    def test_issue_create_with_labels(self):
        parser = build_parser()
        args = parser.parse_args([
            "issue", "create",
            "--title", "Bug",
            "--label", "type:bug",
            "--label", "gate:1-decisions",
        ])
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
            url="https://api.github.com", code=404,
            msg="Not Found", hdrs=None, fp=MagicMock(read=MagicMock(return_value=b'{"message":"not found"}'))
        )
        client = GitHubClient()
        with self.assertRaises(GitHubError) as ctx:
            client.request("GET", "/issues/999")
        self.assertIn("404", str(ctx.exception))

    @patch.dict("os.environ", {"GITHUB_TOKEN": "tok", "GITHUB_REPOSITORY": "a/b"})
    @patch("project_management.github.urlopen")
    def test_graphql_extracts_errors(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps({
            "errors": [{"message": "Something went wrong"}]
        }).encode()
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
            self.assertIn(key, KICKOFF_ASSIGNMENTS,
                          f"Task {key} missing from KICKOFF_ASSIGNMENTS")

    def test_team_members_has_all_users(self):
        expected = {"matdevstamp", "Kassim10", "rcilomba", "umoraghad0-del"}
        self.assertEqual(set(TEAM_MEMBERS.keys()), expected)


if __name__ == "__main__":
    unittest.main()
