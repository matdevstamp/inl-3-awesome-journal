# Task Timeline (Gantt)

_Auto-generated from the draft tasks in `docs/draft_tasks/`. Do not edit by hand._

Regenerate whenever task metadata changes:

```bash
python3 -m project_management plan gantt --output docs/diagrams/task-gantt.md
```

## Legend

| Bar | Meaning |
|---|---|
| `✓` task | **done** — rendered in the mermaid `done` style |
| plain task | **active** — scheduled work (or in progress) |
| `(50% · 3/6 · doing)` | checkbox progress + status, same format as the dependency graph |

Same design as the dependency graph: every task ends on its deadline (or on the
earliest deadline of the tasks that depend on it); duration comes from the
Estimated Effort. Tasks are grouped into Gate sections. Tasks with no usable
date cannot be drawn as a bar — they are listed under the chart until they get
a **Deadline**. (Mermaid gantt has no 'skipped' row state.)

```mermaid
gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d

    section Gate 1-Decisions
    01 Project Setup & Group Contract (0% · 0/26 · todo) : active, 2026-09-04, 1d
    02 Database Choice Discussion (0% · 0/15 · todo) : active, 2026-09-04, 1d
    03 Graphify Architecture Artifacts (0% · 0/7 · todo) : active, 2026-09-05, 1d
    section Gate 2-Scaffold
    04 Database Design & Setup (0% · 0/18 · todo) : active, 2026-09-05, 1d
    05 Vite + Tailwind CSS + shadcn/ui Setup (0% · 0/21 · todo) : active, 2026-09-05, 1d
    06 Backend Project Setup (0% · 0/28 · todo) : active, 2026-09-06, 1d
    07 TypeScript Strict Configuration (0% · 0/21 · todo) : active, 2026-09-06, 1d
    08 ESLint + Prettier Configuration (0% · 0/22 · todo) : active, 2026-09-07, 1d
    09 Playwright E2E Testing (0% · 0/27 · todo) : active, 2026-09-07, 2d
    10 GitHub Actions CI/CD Workflow (0% · 0/32 · todo) : active, 2026-09-08, 1d
    section Gate 3-Features
    11 Backend API & Authentication (0% · 0/24 · todo) : active, 2026-09-15, 2d
    12 Frontend UI Development (0% · 0/30 · todo) : active, 2026-09-14, 3d
    13 Patient View & Search (0% · 0/25 · todo) : active, 2026-09-17, 2d
    14 Medical Notes with Visibility Control (0% · 0/23 · todo) : active, 2026-09-18, 1d
    15 Blockchain Access Logging (0% · 0/23 · todo) : active, 2026-09-15, 2d
    16 P2P Network Implementation (0% · 0/24 · todo) : active, 2026-09-17, 2d
    section Gate 4-Integration
    17 User Roles & Access Control (0% · 0/20 · todo) : active, 2026-09-22, 2d
    18 Socket.io Broadcasting (0% · 0/24 · todo) : active, 2026-09-23, 1d
    section Gate 5-Delivery
    19 Testing & Quality Assurance (0% · 0/27 · todo) : active, 2026-09-28, 2d
    20 Documentation & README (0% · 0/34 · todo) : active, 2026-09-29, 1d
    21 Presentation Preparation (0% · 0/23 · todo) : active, 2026-09-30, 2d
```
