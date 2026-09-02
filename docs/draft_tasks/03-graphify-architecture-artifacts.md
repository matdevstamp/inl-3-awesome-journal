# Task: Graphify Architecture Artifacts

## Metadata
- **Priority:** P0 - Foundation
- **Deadline:** 2026-09-05
- **Status:** TODO
- **Assignee:** Scaffold pair (Person 1 + Person 2)
- **Tags:** graphify, architecture, documentation, mermaid, required, gate:1-decisions
- **Dependencies:** 01-project-setup-group-contract.md, 02-database-choice-discussion.md
- **GitHub Issue:** #3 (https://github.com/matdevstamp/inl-3-awesome-journal/issues/3)
- **Estimated Effort:** 2h

## Requirements

- Record the architecture as reviewable Markdown artifacts before implementation branches diverge.
- Keep generated graphify output limited to the two explicitly approved files.
- Use Mermaid for system, data-flow, access-log, and sequence diagrams, and DBML for the relational model.

## User Stories

- As a teammate, I want an architecture report and diagrams so that I can understand boundaries before editing code.
- As a reviewer, I want diagrams tied to the requirements so that missing flows are visible during pull requests.

## Purpose

Run graphify early, while the repository is still small enough to inspect carefully. Use its report and graph as a review aid for architecture and file relationships, not as a substitute for design decisions.

## Required Outputs

- `graphify-out/graph.html` - the browsable graph visualization
- `graphify-out/GRAPH_REPORT.md` - the plain-language graph report
- `docs/diagrams/system-context.mmd` - Mermaid system-context diagram
- `docs/diagrams/data-flow.mmd` - Mermaid data-flow diagram showing SQL, API, blockchain access-log chain, and the two server nodes
- `docs/diagrams/sequence-access-log.mmd` - Mermaid sequence diagram for a permitted read and its access-log propagation
- `database/schema.dbml` - DBML source for the relational model; coordinate its first version with task 02

All other graphify output, including JSON, cache files, intermediate extraction files, logs, and local metadata, must remain ignored and must not be committed.

## Design

The diagrams must distinguish SQL medical data from blockchain access-log data and show both server nodes without implying that medical records are placed on-chain.

## Implementation Notes

1. Run graphify against the repository after the initial scaffold and inspect the report for unexpected coupling, missing links, or accidental sensitive files.
2. Re-run it after the first integrated feature milestone and before final submission.
3. Keep generated artifacts deterministic enough to review; record the command and graphify version in the README.
4. Use Mermaid source files in the repository so diagrams can be reviewed in pull requests and rendered by GitHub-compatible tooling.

## Done Criteria

- [ ] `graph.html` and `GRAPH_REPORT.md` are present in `graphify-out/` and are the only graphify outputs tracked by Git
- [ ] `git check-ignore` confirms graphify cache/intermediate files are ignored
- [ ] The three Mermaid diagrams render without syntax errors and match the implemented boundaries
- [ ] `schema.dbml` matches the approved Prisma schema and includes relationships/indexes
- [ ] README links to every artifact and explains how to regenerate graphify outputs
- [ ] A short architecture review records at least one finding or explicitly says no findings were found

## Notes

- Re-run the review after the first integrated milestone and before submission.

## Questions to Resolve

- [ ] Which graphify version and command will be documented in the README?