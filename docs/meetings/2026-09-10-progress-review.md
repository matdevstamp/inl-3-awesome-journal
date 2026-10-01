# Meeting Notes - 2026-09-10

- **Meeting type:** Progress review
- **Facilitator:** Not recorded
- **Timekeeper:** Not recorded
- **Note-taker:** MatDevstamp
- **Attendees:** Not recorded
- **Absent:** Not recorded

## Agenda

1. Check the previous action items.
2. Review the relevant sections of `docs/Raw_Requirements.md`.
3. Discuss progress, decisions, blockers, and risks.
4. Assign next actions with one owner and a due date each.
5. Read back decisions and confirm the next meeting.

## Meeting Scope Policy

No topics were parked during this progress review.

| Parked topic | Why separate time is needed | Required participants | Owner | Proposed meeting | Decision needed |
|---|---|---|---|---|---|
| None | — | — | — | — | — |

## Previous Actions

| Action | Owner | Status | Follow-up |
|---|---|---|---|
| Start Task 15 and add the first access-log tests | Stream-D owner | In progress | Continue test-first implementation and then move toward Task 16 |
| Continue the frontend patient view and authentication work | UI and backend owners | In progress | Keep the frontend/backend split explicit |
| Review the next available feature code | Review owner | In progress | Continue reviewing the next feature branches |

## Requirements Checkpoint

| Raw requirement or section | Covered by task/PR/test/demo | Status | Missing evidence or next action |
|---|---|---|---|
| Patient search and journal view | Task 12 and patient-view UI | In progress | Add a reviewable UI slice with mock data where needed |
| Login, JWT, roles, and protected routes | Task 13, authentication PR #22 and backend work | In progress | Complete the remaining route and role checks |
| Blockchain access logging and P2P | Tasks 15 and 16 | Missing evidence | Complete the first access-log tests and define the next P2P step |
| Meeting documentation and traceability | This note | Covered | Keep decisions and owners in the repository |

## Discussion and Decisions

- PR #22 was merged. It contains the first frontend/auth shell with login, access denied, dashboard shell, mocked authentication, and styling. Lint, build, and typecheck were reported green before merge.
- The UI owner will continue with patient search and the patient/journal view, using mock data until the backend is ready.
- The backend owner is continuing the authentication implementation.
- The Stream-D owner reviewed Task 15 and the existing test structure, created the feature branch, and will work test-first on the access-log/blockchain core before continuing with Task 16.
- The review owner checked the authentication/backend work and is waiting for the next reviewable increment.
- No blockers were reported. The timing of Task 16 relative to Task 15 remains an open question.

## Blockers and Risks

| Blocker or risk | Impact | Owner | Next action | Due |
|---|---|---|---|---|
| Task 16 sequencing is not confirmed | Could delay the P2P demo path | Stream-D owner and review owner | Confirm whether Task 16 starts in parallel or after the Task 15 core | Before the next progress review |
| Frontend still depends on backend readiness | UI may need temporary mock data | UI and backend owners | Keep the contract explicit and update it as routes land | Ongoing |
| Additional authentication code is awaiting review | Integration may slow down | Backend and review owners | Push the next reviewable increment | Before the next progress review |

## New Action Items

| Action | Owner | Due | Related task or requirement |
|---|---|---|---|
| Continue Task 15 test-first and establish the access-log blockchain core | Stream-D owner | Tuesday, 2026-09-15 | Task 15 and access-log requirements |
| Confirm the sequencing of Task 16 relative to Task 15 | Stream-D owner and review owner | 2026-09-15 | Tasks 15 and 16 |
| Continue the patient view/search UI with mock data where necessary | UI owner | 2026-09-15 | Task 12 |
| Continue authentication and protected-route implementation | Backend owner | 2026-09-15 | Task 13 |
| Review the next available branches | Review owner | Ongoing | PR workflow |

## Closing Check

- **What changed since the last meeting?** PR #22 was merged and the next patient-view work was defined; Task 15 now has a test-first plan.
- **What is the next smallest demonstrable outcome?** A reviewable Task 15 test/core slice or an updated patient-view slice.
- **What must be re-checked against the raw requirements before the next meeting?** Access-log integrity, P2P behavior, protected routes, and the evidence for the two-server flow.
- **Next meeting:** 2026-09-15, standup, facilitator and timekeeper not recorded; note-taker MatDevstamp.
