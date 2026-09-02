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
            with patch.object(sys, "argv", arguments), patch.object(
                cli, "GitHubClient", return_value=fake_client
            ), redirect_stdout(io.StringIO()):
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


if __name__ == "__main__":
    unittest.main()
