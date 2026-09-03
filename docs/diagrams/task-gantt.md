# Task Timeline (Gantt)

_Auto-generated from the draft tasks in `docs/draft_tasks/`. Do not edit by hand._

Regenerate whenever task metadata changes:

```bash
python3 -m project_management plan gantt --output docs/diagrams/task-gantt.md
```

```mermaid
gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d

    section Gate 1-Decisions
    01 Project Setup & Group Contract : active, 2026-09-04, 1d
    02 Database Choice Discussion : active, 2026-09-04, 1d
    03 Graphify Architecture Artifacts : active, 2026-09-05, 1d
    section Gate 2-Scaffold
    04 Database Design & Setup : active, 2026-09-05, 1d
    05 Vite + Tailwind CSS + shadcn/ui Setup : active, 2026-09-05, 1d
    06 Backend Project Setup : active, 2026-09-06, 1d
    07 TypeScript Strict Configuration : active, 2026-09-06, 1d
    08 ESLint + Prettier Configuration : active, 2026-09-07, 1d
    09 Playwright E2E Testing : active, 2026-09-07, 2d
    10 GitHub Actions CI/CD Workflow : active, 2026-09-08, 1d
    section Gate 3-Features
    11 Backend API & Authentication : active, 2026-09-15, 2d
    12 Frontend UI Development : active, 2026-09-14, 3d
    13 Patient View & Search : active, 2026-09-17, 2d
    14 Medical Notes with Visibility Control : active, 2026-09-18, 1d
    15 Blockchain Access Logging : active, 2026-09-15, 2d
    16 P2P Network Implementation : active, 2026-09-17, 2d
    section Gate 4-Integration
    17 User Roles & Access Control : active, 2026-09-22, 2d
    18 Socket.io Broadcasting : active, 2026-09-23, 1d
    section Gate 5-Delivery
    19 Testing & Quality Assurance : active, 2026-09-28, 2d
    20 Documentation & README : active, 2026-09-29, 1d
    21 Presentation Preparation : active, 2026-09-30, 2d
```
