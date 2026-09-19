# Task Timeline (Gantt)

_Auto-generated from the draft tasks in `docs/draft_tasks/`. Do not edit by hand._

Open in **[Mermaid Live](https://mermaid.live/edit#pako:eJyVlE1u20gQhfc5xdtYcGAz4o_8o-xkUXYExIbGcjLwst0siRXR3UJ30YrOke3cY_Y5Sk4yIKmITiDLk53AQn316r1qzZUReQMAwlIQJs5-IS2440cq2FBdypTQpXWPSoD7-_v74Po6SNO6pL6y_1k6eMBB9qb-7EkLW4MrJYQoSEmzZ2t8XQyj7ZgpSblEB1fOlksMrRGntODHP9_wHpk1dIw4jE-DsB-EvWNEWQOIkSpRD8oThrllTUjZ69JXM15tTnDl1DLn2RoDp3MW0lI6wsAJz5QWv5twtiX8slwcTLWazWyxofdaaSl5nht0Nlu-Qg1PcENf5d0XjyPcKS5WbDIMp1Mcwecq06Zb8v9EneJC6QWZ7DejD39OuLWlED4okxXkfC3RPbEm__ZV9hnu1kuaasdLwVQca6mCm_G8dEpeDOAZ4Ryj6Uc2giNMHIkwuT8k9DEp1HrleJ4LRvEId-SFzXx34-kx4qYxCnHF8qF8wKCO0GM47g5T_G3dYlbY1R8lnwSXpKrLaa46iramDyZjdDAoJScjrPfs1G-lxbh01kjV_2mMlJ6osMtHMoLDfnKA7_8iPu8mYfUjs2zmb_EeSgs__cZLNrwEEyVc9X9mWtURK6fznTqiXqujh2vKWKsCN1bIY8WS4zN7fuCCZd08UlvgMI5qVSfduLdXVBxv_YtOcFFYvdC5YoOB1uQ9Ptr5_KXs4rAVdopJPMENycq6BcaPy4Iqe15291nzL8H1grERmje31rDP8MmTw60tqHoNG2XbVcN607Ab1_aLzezORZNW7DmmVi9I3rHFhbMq06q50JbV28s63310J0FKBT-RWzdz-tvT7-CvUtUJDbwvnTKang072zusPcM4RGp12Rrbwe1okF6PcNivWUk32S-8vxUeV__z5LeoiaOl2rzwVlmyj5Y0Ef4HiX37tw)** (pako/zlib-compressed, verified to round-trip).

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
    01 Project Setup & Group Contract ✓ : done, 2026-09-04, 1d
    02 Database Choice Discussion ✓ : done, 2026-09-04, 1d
    03 Graphify Architecture Artifacts ✓ : done, 2026-09-07, 1d
    section Gate 2-Scaffold
    04 Database Design & Setup ✓ : done, 2026-09-07, 1d
    05 Next.js + Tailwind CSS + shadcn/ui Setup ✓ : done, 2026-09-07, 1d
    06 Backend Project Setup (Next.js Route Handlers & Services) ✓ : done, 2026-09-07, 1d
    07 TypeScript Strict Configuration ✓ : done, 2026-09-07, 1d
    08 ESLint + Prettier Configuration ✓ : done, 2026-09-07, 1d
    09 Playwright E2E Testing ✓ : done, 2026-09-06, 2d
    10 GitHub Actions CI/CD Workflow ✓ : done, 2026-09-07, 1d
    section Gate 3-Features
    11 Backend API & Authentication ✓ : done, 2026-09-09, 2d
    12 Frontend UI Development (93% · 28/30 · doing) : active, 2026-09-09, 3d
    13 Patient View & Search ✓ : done, 2026-09-14, 2d
    14 Medical Notes with Visibility Control (21% · 5/24 · doing) : active, 2026-09-22, 1d
    15 Blockchain Access Logging ✓ : done, 2026-09-20, 2d
    16 P2P Network Implementation ✓ : done, 2026-09-20, 2d
    section Gate 4-Integration
    17 User Roles & Access Control (0% · 0/20 · todo) : active, 2026-09-23, 2d
    18 Socket.io Broadcasting (0% · 0/24 · todo) : active, 2026-09-28, 1d
    section Gate 5-Delivery
    19 Testing & Quality Assurance (0% · 0/27 · todo) : active, 2026-09-29, 2d
    20 Documentation & README (9% · 3/34 · todo) : active, 2026-09-29, 1d
    21 Presentation Preparation (0% · 0/23 · todo) : active, 2026-09-30, 2d
```
