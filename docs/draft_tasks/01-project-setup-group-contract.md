# Task: Project Setup & Group Contract

## Metadata
- **Priority:** P0 - Critical
- **Deadline:** 2026-09-04
- **Status:** TODO
- **Assignee:** Team
- **Tags:** setup, documentation, required, gate:1-decisions
- **Dependencies:** None
- **GitHub Issue:** #1 (https://github.com/matdevstamp/inl-3-awesome-journal/issues/1)
- **Estimated Effort:** 2h

## Requirements

- Group contract must be written before starting the project
- Repository must be set up on GitHub (public or invite postmodernistx as collaborator)
- README must exist with project description
- Agile workflow must be established from start
- `docs/Raw_Requirements.md` must be established as the scope authority and reviewed continuously
- Each meeting must have an assigned facilitator, timekeeper, and note-taker
- A shared agenda and meeting-note template must be agreed before feature work begins

## User Stories

- As a team member, I want clear roles, meeting rules, and a PR workflow so that collaboration is predictable.
- As a project, we want the raw requirements and definition of done recorded before coding so that scope decisions are visible.

## Design

### Group Contract Template
The contract should cover:
- Team member roles and responsibilities
- Communication channels and meeting schedule
- Decision-making process
- Code review and PR workflow
- Conflict resolution

### Repository Structure
```
├── docs/
│   ├── tasks/
│   └── meetings/
├── src/
│   ├── frontend/
│   └── backend/
├── blockchain/
├── database/
├── README.md
└── gruppkontrakt.md
```

## Tasks

- [ ] Create GitHub repository
- [ ] Write gruppkontrakt.md using provided template
- [ ] Add the per-member loggbok files under `docs/logbooks/` (or the format the group decides at kickoff)
- [ ] Set up branch protection rules (no direct commits to main)
- [ ] Create README.md with initial project description
- [ ] Set up project board (GitHub Projects or similar)
- [ ] Establish meeting schedule (min 2 standups/week)
- [ ] Assign the first meeting facilitator and note-taker; define a rotation for later meetings
- [ ] Add the meeting agenda and note template from `docs/MEETING_TEMPLATE.md`
- [ ] Add a requirements-checkpoint agenda item to every planning meeting and at least two meetings per week
- [ ] Create a lightweight requirements traceability checklist linking each requirement to a task and later evidence
- [ ] Define PR review process
- [ ] Set up development environment instructions

## Done Criteria

- [ ] gruppkontrakt.md exists and is committed
- [ ] Logbook format decided at kickoff and each member's logbook file exists in `docs/logbooks/`
- [ ] README.md exists with project description
- [ ] Repository is public or postmodernistx is collaborator
- [ ] Branch protection rules are configured
- [ ] All team members have access
- [ ] Meeting schedule is documented
- [ ] Requirements checkpoint format is documented and used in the first meeting note
- [ ] Meeting role rotation is documented and every scheduled meeting has an owner for facilitation and notes

## Notes

- The group contract should be specific enough to be actionable
- Consider using a template from the course resources
- Make sure everyone signs/agrees to the contract
- Re-read `docs/Raw_Requirements.md` before finalizing the contract so the workflow reflects the actual assignment

## Questions to Resolve

- [ ] Which frontend framework will we use? (React, Vue, Svelte?)
- [ ] Which authentication method? (JWT, sessions, passwordless?)
- [ ] How will we handle the blockchain implementation?
- [ ] What database will we use? (PostgreSQL, MySQL, SQLite?)
