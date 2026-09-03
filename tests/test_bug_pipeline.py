import csv
import io
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

from project_management import cli
from project_management.bug_reports import promote_report, triage_report


class FakeGitHubClient:
    repository = "example/project"

    def __init__(self):
        self.created_issue = None
        self.stamped_fields = None
        self.linked_dependencies = []
        self.existing_dependencies = {}  # issue number -> [blocking issue numbers]
        self.updated_bodies = {}

    def create_issue(self, title, body, labels, assignee):
        self.created_issue = {
            "number": 42,
            "title": title,
            "body": body,
            "labels": labels,
            "assignee": assignee,
            "html_url": "https://github.com/example/project/issues/42",
        }
        return self.created_issue

    def stamp_project_fields(self, issue_number, fields):
        self.stamped_fields = (issue_number, fields)

    def issue(self, number):
        body = self.updated_bodies.get(number, f"body for {number}")
        return {
            "number": number,
            "id": number * 100,
            "title": f"Issue {number}",
            "body": body,
        }

    def add_dependency(self, issue_number, blocking_issue_id):
        self.linked_dependencies.append((issue_number, blocking_issue_id))
        self.existing_dependencies.setdefault(issue_number, []).append(blocking_issue_id // 100)

    def list_dependencies(self, issue_number):
        return [{"number": n} for n in self.existing_dependencies.get(issue_number, [])]

    def update_issue(self, number, **changes):
        self.updated_bodies[number] = changes.get("body")


class BugPipelineTests(unittest.TestCase):
    def test_csv_to_draft_to_real_task_preserves_lineage(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            csv_path = root / "bug-reports.csv"
            csv_path.write_text(
                "report_id,reported_at,reporter,summary,steps_to_reproduce,expected_behavior,actual_behavior,environment,severity,evidence,privacy_checked,triage_status,lead_owner,draft_task,github_issue,resolution\n"
                "BR-0100,2026-09-03,student,Login fails,Open login; submit form,Dashboard,Error,local,high,sanitized,yes,untriaged,,,,\n",
                encoding="utf-8",
            )
            triage_report(csv_path, "BR-0100", "accepted", "matdevstamp")
            draft_path = promote_report(
                csv_path, "BR-0100", root / "draft_tasks", "rcilomba", "2026-09-18"
            )

            fake_client = FakeGitHubClient()
            arguments = [
                "project-management",
                "task",
                "create",
                "--title",
                "Bug fix - Login fails",
                "--draft",
                str(draft_path),
                "--assignee",
                "rcilomba",
            ]
            with (
                patch.object(sys, "argv", arguments),
                patch.object(cli, "GitHubClient", return_value=fake_client),
                redirect_stdout(io.StringIO()),
            ):
                cli.main()

            stamped_draft = draft_path.read_text(encoding="utf-8")
            self.assertIn("Source bug report:** BR-0100", stamped_draft)
            self.assertIn("GitHub Issue:** #42", stamped_draft)
            self.assertIn("red", stamped_draft)
            self.assertIn("green", stamped_draft)
            self.assertEqual(fake_client.stamped_fields[0], 42)
            self.assertEqual(fake_client.stamped_fields[1]["Target date"], "2026-09-18")

            with csv_path.open(newline="", encoding="utf-8") as handle:
                row = next(csv.DictReader(handle))
            self.assertEqual(row["triage_status"], "draft-created")
            self.assertTrue(row["draft_task"].endswith("bug-br-0100.md"))


class TaskCreateDependencyTests(unittest.TestCase):
    def test_depends_on_flag_links_blocked_by(self):
        fake_client = FakeGitHubClient()
        arguments = [
            "project-management",
            "task",
            "create",
            "--title",
            "Do the thing",
            "--depends-on",
            "1",
            "--depends-on",
            "2",
        ]
        with (
            patch.object(sys, "argv", arguments),
            patch.object(cli, "GitHubClient", return_value=fake_client),
            redirect_stdout(io.StringIO()),
        ):
            cli.main()

        self.assertEqual(fake_client.linked_dependencies, [(42, 100), (42, 200)])

    def test_draft_metadata_links_dependencies_and_related(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "01-prereq.md").write_text(
                "# Task: Prereq\n## Metadata\n- **GitHub Issue:** #1 (url)\n",
                encoding="utf-8",
            )
            draft_path = root / "02-dependent.md"
            draft_path.write_text(
                "# Task: Dependent\n"
                "## Metadata\n"
                "- **Dependencies:** 01-prereq.md\n"
                "- **Related:** 01-prereq.md\n"
                "- **Estimated Effort:** 2h\n"
                "\n## Requirements\n- stuff\n",
                encoding="utf-8",
            )

            fake_client = FakeGitHubClient()
            arguments = [
                "project-management",
                "task",
                "create",
                "--title",
                "Dependent",
                "--draft",
                str(draft_path),
            ]
            with (
                patch.object(sys, "argv", arguments),
                patch.object(cli, "GitHubClient", return_value=fake_client),
                redirect_stdout(io.StringIO()),
            ):
                cli.main()

            # Blocked-by relationship added natively
            self.assertEqual(fake_client.linked_dependencies, [(42, 100)])
            # Related recorded in the issue body
            self.assertIn("**Related:** #1", fake_client.created_issue["body"])
            # Draft stamped with the new issue number
            self.assertIn("GitHub Issue:** #42", draft_path.read_text(encoding="utf-8"))

    def test_deps_sync_is_idempotent_and_skips_existing(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "01-prereq.md").write_text(
                "# Task: Prereq\n## Metadata\n- **GitHub Issue:** #1 (url)\n",
                encoding="utf-8",
            )
            (root / "02-dependent.md").write_text(
                "# Task: Dependent\n## Metadata\n"
                "- **Dependencies:** 01-prereq.md\n"
                "- **Related:** 01-prereq.md\n"
                "- **GitHub Issue:** #2 (url)\n",
                encoding="utf-8",
            )

            fake_client = FakeGitHubClient()
            # #2 already blocked by #1 and body already carries the Related line
            fake_client.existing_dependencies[2] = [1]
            fake_client.updated_bodies[2] = "body for 2\n\n**Related:** #1\n"

            from project_management.cli import deps_sync

            summary = deps_sync(fake_client, str(root), dry_run=False)
            # Nothing to do: no duplicate link, no body rewrite
            self.assertEqual(summary["linked"], 0)
            self.assertEqual(summary["related_updated"], 0)
            self.assertEqual(fake_client.linked_dependencies, [])
            self.assertEqual(fake_client.updated_bodies, {2: "body for 2\n\n**Related:** #1\n"})

    def test_deps_sync_adds_missing_relationships(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "01-prereq.md").write_text(
                "# Task: Prereq\n## Metadata\n- **GitHub Issue:** #1 (url)\n",
                encoding="utf-8",
            )
            (root / "02-dependent.md").write_text(
                "# Task: Dependent\n## Metadata\n"
                "- **Dependencies:** 01-prereq.md\n"
                "- **Related:** 01-prereq.md\n"
                "- **GitHub Issue:** #2 (url)\n",
                encoding="utf-8",
            )

            fake_client = FakeGitHubClient()
            from project_management.cli import deps_sync

            summary = deps_sync(fake_client, str(root), dry_run=False)
            self.assertEqual(summary["linked"], 1)
            self.assertEqual(summary["related_updated"], 1)
            self.assertEqual(fake_client.linked_dependencies, [(2, 100)])
            self.assertIn("**Related:** #1", fake_client.updated_bodies[2])
            # Second run: idempotent
            summary = deps_sync(fake_client, str(root), dry_run=False)
            self.assertEqual(summary["linked"], 0)
            self.assertEqual(summary["related_updated"], 0)


if __name__ == "__main__":
    unittest.main()
