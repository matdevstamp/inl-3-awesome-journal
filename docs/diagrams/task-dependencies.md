# Task Dependency Graph

_Auto-generated from the draft tasks in `docs/draft_tasks/`. Do not edit by hand._

Regenerate whenever task metadata changes:

```bash
python3 -m project_management plan graph --output docs/diagrams/task-dependencies.md
```

## Legend

| Symbol | Meaning |
|---|---|
| `A --> B` (solid arrow) | B depends on A — B is **blocked by** A |
| `A -. related .- B` (dotted line) | A and B are **related** (soft link, not a dependency) |
| 🟢 green node | task **done** (marked ✓) |
| 🔵 blue node | **in progress** |
| ⬜ dashed-gray node | **todo** — not started |
| `(50% · 3/6 · doing)` | checkbox progress: 3 of 6 task boxes ticked, then the status |
| `(0/0 · todo)` | no checkboxes written yet — the checklist itself is still to be made |

Nodes are grouped into **Gate** subgraphs when tagged (`gate:1-decisions` …
`gate:5-delivery`). Tick `- [x]` boxes in the draft task files as the work
happens, then regenerate this diagram to update the percentages.

```mermaid
flowchart TD
    %% Solid arrow A --> B: B depends on A (blocked by A)
    %% Dotted line A -. related .- B: A and B are related
    %% Colors: green done · blue in progress · dashed gray todo (not started)
    subgraph decisions["Gate 1-Decisions"]
    T01["01 Project Setup & Group Contract (23% · 6/26 · todo)"]
    T02["02 Database Choice Discussion (27% · 4/15 · todo)"]
    T03["03 Graphify Architecture Artifacts (0% · 0/7 · todo)"]
    end
    subgraph scaffold["Gate 2-Scaffold"]
    T04["04 Database Design & Setup (20% · 4/20 · todo)"]
    T05["05 Next.js + Tailwind CSS + shadcn/ui Setup (0% · 0/21 · todo)"]
    T06["06 Backend Project Setup (Next.js Route Handlers & Services) (9% · 2/23 · todo)"]
    T07["07 TypeScript Strict Configuration (0% · 0/22 · todo)"]
    T08["08 ESLint + Prettier Configuration (0% · 0/22 · todo)"]
    T09["09 Playwright E2E Testing (0% · 0/27 · todo)"]
    T10["10 GitHub Actions CI/CD Workflow (0% · 0/33 · todo)"]
    end
    subgraph features["Gate 3-Features"]
    T11["11 Backend API & Authentication (8% · 2/24 · todo)"]
    T12["12 Frontend UI Development (13% · 4/30 · todo)"]
    T13["13 Patient View & Search (0% · 0/25 · todo)"]
    T14["14 Medical Notes with Visibility Control (0% · 0/23 · todo)"]
    T15["15 Blockchain Access Logging (0% · 0/23 · todo)"]
    T16["16 P2P Network Implementation (0% · 0/24 · todo)"]
    end
    subgraph integration["Gate 4-Integration"]
    T17["17 User Roles & Access Control (0% · 0/20 · todo)"]
    T18["18 Socket.io Broadcasting (0% · 0/24 · todo)"]
    end
    subgraph delivery["Gate 5-Delivery"]
    T19["19 Testing & Quality Assurance (0% · 0/27 · todo)"]
    T20["20 Documentation & README (9% · 3/34 · todo)"]
    T21["21 Presentation Preparation (0% · 0/23 · todo)"]
    end
    T01 --> T02
    T01 --> T03
    T02 --> T03
    T01 --> T04
    T02 --> T04
    T03 --> T04
    T01 --> T05
    T03 --> T05
    T04 --> T06
    T05 --> T06
    T05 --> T07
    T06 --> T07
    T05 --> T08
    T07 --> T08
    T05 --> T09
    T06 --> T09
    T07 --> T09
    T08 --> T09
    T05 --> T10
    T08 --> T10
    T07 --> T10
    T06 --> T10
    T04 --> T11
    T07 --> T11
    T06 --> T11
    T05 --> T12
    T07 --> T12
    T06 --> T12
    T04 --> T13
    T11 --> T13
    T12 --> T13
    T04 --> T14
    T11 --> T14
    T12 --> T14
    T04 --> T15
    T07 --> T15
    T06 --> T15
    T15 --> T16
    T06 --> T16
    T11 --> T17
    T12 --> T17
    T13 --> T17
    T14 --> T17
    T17 --> T18
    T14 --> T18
    T16 --> T18
    T12 --> T18
    T17 --> T19
    T15 --> T19
    T16 --> T19
    T18 --> T19
    T01 --> T20
    T19 --> T21
    T09 --> T21
    T20 --> T21
    T03 -. related .- T20
    T09 -. related .- T10
    T09 -. related .- T19
    T13 -. related .- T14
    T15 -. related .- T18
    T19 -. related .- T20
    classDef done fill:#dcedc8,stroke:#558b2f,color:#1b5e20
    classDef doing fill:#dbe9fb,stroke:#1565c0,color:#0d47a1
    classDef todo fill:#ffffff,stroke:#b0bec5,color:#546e7a,stroke-dasharray:5 4
    class T01 todo;
    class T02 todo;
    class T03 todo;
    class T04 todo;
    class T05 todo;
    class T06 todo;
    class T07 todo;
    class T08 todo;
    class T09 todo;
    class T10 todo;
    class T11 todo;
    class T12 todo;
    class T13 todo;
    class T14 todo;
    class T15 todo;
    class T16 todo;
    class T17 todo;
    class T18 todo;
    class T19 todo;
    class T20 todo;
    class T21 todo;
```
