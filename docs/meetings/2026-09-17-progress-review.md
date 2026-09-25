# Meeting Notes - 2026-09-17

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
| Review the Task 14 UI PR | Review owner | In progress | Continue the review and return actionable feedback |
| Begin the backend visibility portion of Task 14 | Backend owner | In progress | Finish create/edit and visibility work |
| Continue Task 15 and prepare the P2P follow-up | Stream-D owner | In progress | Use the Task 14 create/edit dependency and prepare review evidence |

## Requirements Checkpoint

| Raw requirement or section | Covered by task/PR/test/demo | Status | Missing evidence or next action |
|---|---|---|---|
| Patient search, journal view, and note visibility | Tasks 12 and 14 | In progress | Push the UI changes and complete the backend create/edit/visibility work |
| Authentication and authorization | Task 11 merged; remaining issue #13 work | In progress | Complete role guards, patient endpoints, records/notes CRUD, and access-log routes |
| Blockchain access logging and P2P | Tasks 15 and 16 | In progress | Push the next Task 15/16 increment and obtain review |
| Presentation evidence and traceability | Tasks 20 and 21 | Missing evidence | Create the first presentation outline and keep meeting evidence current |

## Discussion and Decisions

- The patient journal and patient search UI were improved with tabs, background, and a back button. The changes were committed but not yet pushed. The next step is to refine the interface and test mobile responsiveness.
- Task 11 was reported complete. Authentication, roles, middleware, rate limiting, CORS, and tests were implemented, and the CI checks were reported green. PR #23 was merged.
- The backend owner started Task 14 and plans to finish the create/edit part by Sunday.
- The Stream-D owner is continuing Tasks 15 and 16. Task 15 depends on the Task 14 create/edit events so access logging can be connected to those events. P2P is waiting for review.
- The review owner checked the Task 15 work on PR #32, left code comments and a checklist, and agreed that Tasks 15 and 16 should remain in the same branch because P2P depends on the chain.
- The team expects to reach the Gate 3 target around the end of the week or early the following week.
- The presentation outline should cover introduction, demo, working method, tools, Playwright, ESLint, workflows, Next.js, challenges, and lessons learned. The team will aim for a six-minute presentation with four minutes of margin in a ten-minute slot.

## Blockers and Risks

| Blocker or risk | Impact | Owner | Next action | Due |
|---|---|---|---|---|
| Task 15 depends on Task 14 create/edit events | Access-log integration cannot be completed independently | Backend and Stream-D owners | Finish and communicate the Task 14 backend slice | 2026-09-20 |
| The latest UI commit has not been pushed | Review and integration are delayed | UI owner | Push the next UI increment | 2026-09-18 |
| P2P work is waiting for review | The two-server flow remains unverified | Review and Stream-D owners | Review the combined Task 15/16 branch | Before the next standup |
| Remaining issue #13 routes and role guards are unfinished | Authorization evidence is incomplete | Backend owner | Continue the listed route-handler work | Before Gate 4 |

## New Action Items

| Action | Owner | Due | Related task or requirement |
|---|---|---|---|
| Push the latest patient-journal/search UI work and test mobile responsiveness | UI owner | 2026-09-18 | Tasks 12 and 14 |
| Finish Task 14 create/edit and visibility work | Backend owner | 2026-09-20 | Task 14 |
| Continue Tasks 15 and 16, connect access logging to the relevant events, and prepare the branch for review | Stream-D owner | 2026-09-20 | Tasks 15 and 16 |
| Review the combined Task 15/16 branch and the Task 14 UI PR | Review owner | Before the next standup | Tasks 12, 14, 15, and 16 |
| Create the first presentation outline | Team, coordinated by the project lead | Next meeting | Task 21 |
| Decide whether to close the older PR #32 after the combined branch is reviewed | Review and Stream-D owners | After the combined branch review | Task 15/16 workflow |

## Closing Check

- **What changed since the last meeting?** Task 11 was completed and merged, Task 14 was split into UI/backend work, and the combined Task 15/16 review direction was confirmed.
- **What is the next smallest demonstrable outcome?** A reviewed Task 14 UI/backend slice connected to the access-log work.
- **What must be re-checked against the raw requirements before the next meeting?** Two-server P2P behavior, server-side authorization, note visibility, and medical-data privacy boundaries.
- **Next meeting:** 2026-09-22, standup, facilitator and timekeeper not recorded; note-taker MatDevstamp.
