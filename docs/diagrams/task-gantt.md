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
    01 Project Setup & Group Contract (23% · 6/26 · todo) : active, 2026-09-04, 1d
    02 Database Choice Discussion (27% · 4/15 · todo) : active, 2026-09-04, 1d
    03 Graphify Architecture Artifacts (100% · 7/7 · todo) : active, 2026-09-07, 1d
    section Gate 2-Scaffold
    04 Database Design & Setup (50% · 10/20 · doing) : active, 2026-09-07, 1d
    05 Next.js + Tailwind CSS + shadcn/ui Setup (0% · 0/21 · doing) : active, 2026-09-07, 1d
    06 Backend Project Setup (Next.js Route Handlers & Services) (48% · 11/23 · doing) : active, 2026-09-07, 1d
    07 TypeScript Strict Configuration (45% · 10/22 · doing) : active, 2026-09-07, 1d
    08 ESLint + Prettier Configuration (32% · 7/22 · doing) : active, 2026-09-07, 1d
    09 Playwright E2E Testing (11% · 3/27 · doing) : active, 2026-09-06, 2d
    10 GitHub Actions CI/CD Workflow (21% · 7/33 · doing) : active, 2026-09-07, 1d
    section Gate 3-Features
    11 Backend API & Authentication (8% · 2/24 · todo) : active, 2026-09-09, 2d
    12 Frontend UI Development (13% · 4/30 · todo) : active, 2026-09-09, 3d
    13 Patient View & Search (0% · 0/25 · todo) : active, 2026-09-14, 2d
    14 Medical Notes with Visibility Control (0% · 0/23 · todo) : active, 2026-09-16, 1d
    15 Blockchain Access Logging (0% · 0/23 · todo) : active, 2026-09-13, 2d
    16 P2P Network Implementation (0% · 0/24 · todo) : active, 2026-09-15, 2d
    section Gate 4-Integration
    17 User Roles & Access Control (0% · 0/20 · todo) : active, 2026-09-17, 2d
    18 Socket.io Broadcasting (0% · 0/24 · todo) : active, 2026-09-21, 1d
    section Gate 5-Delivery
    19 Testing & Quality Assurance (0% · 0/27 · todo) : active, 2026-09-22, 2d
    20 Documentation & README (9% · 3/34 · todo) : active, 2026-09-24, 1d
    21 Presentation Preparation (0% · 0/23 · todo) : active, 2026-09-28, 2d
```
