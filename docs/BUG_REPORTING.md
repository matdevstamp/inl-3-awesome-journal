# Bug Reporting and Fix Workflow

This project keeps raw bug intake separate from the task board. The raw log is [`bug-reports.csv`](bug-reports.csv); the lead converts valid reports into draft tasks and then GitHub issues after triage.

## Report a Bug

Add one row to `docs/bug-reports.csv` with:

- A unique `report_id`, such as `BR-0002`
- Date, reporter, and a short neutral summary
- Reproduction steps, expected behavior, and actual behavior
- Environment, severity, and sanitized evidence
- `privacy_checked=yes` only after confirming the row contains no sensitive data
- Leave triage, owner, task, issue, and resolution fields for the lead

Never record patient names, personal numbers, medical content, credentials, tokens, private URLs, or unsanitized screenshots. Use fictional identifiers such as `patient-001`.

## Lead Triage

The lead reviews new rows regularly and sets `triage_status` to one of:

- `untriaged`: not reviewed yet
- `duplicate`: link or reference the existing report
- `not-reproducible`: record what was tried and ask for more information
- `expected-behavior`: explain the intended behavior
- `accepted`: valid defect ready to become work
- `in-progress`: reproduction or fix is underway
- `verified`: fix is confirmed by tests
- `draft-created`: accepted report has been converted into a stamped draft task
- `closed`: merged and no further action is needed

For an `accepted` report, the lead creates or updates a draft task with the scope, owner, deadline, and report ID. After the team agrees, create the real GitHub issue and record its number in the CSV. The CSV is an intake/audit trail, not a replacement for the project board.

## Red/Green Debugging

For a user-facing bug:

1. Reproduce it with a focused Playwright E2E test or the narrowest suitable test.
2. Run the test and capture the expected failure: **red**.
3. Implement the smallest root-cause fix.
4. Run the same test and confirm it passes: **green**.
5. Add unit or integration coverage when the defect involves API, authorization, database, or blockchain behavior.
6. Open a PR linking the report, reproduction test, and draft/issue. Include the root cause and test commands.
7. The lead verifies CI and updates the raw report to `verified` or `closed`.

A manual demonstration alone does not close a bug. The regression test is the durable evidence.

## CLI Workflow

The lead can manage the local intake without opening GitHub:

```bash
# Review all raw reports or only reports waiting for triage
python3 -m project_management bug list
python3 -m project_management bug list --status untriaged

# Accept a valid report and identify the lead
python3 -m project_management bug triage BR-0002 --status accepted --lead-owner matdevstamp

# Create a stamped draft task and update the CSV lineage columns
python3 -m project_management bug promote BR-0002 \
	--assignee rcilomba \
	--deadline 2026-09-18 \
	--yes
```

Promotion writes `docs/draft_tasks/bug-br-0002.md` with the source report, report timestamp, creation timestamp, reproduction details, and red/green acceptance criteria. It also writes the draft path back to `docs/bug-reports.csv`.

## Useful Commands

```bash
python3 -m project_management plan show
python3 -m project_management issue create --title "Fix ..." --body "See BR-0002"
python3 -m project_management issue comment 42 "Red: ...; Green: ...; Tests: ..."
```
