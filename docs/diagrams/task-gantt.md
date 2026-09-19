# Task Timeline (Gantt)

_Auto-generated from the draft tasks in `docs/draft_tasks/`. Do not edit by hand._

Open in **[Mermaid Live](https://mermaid.live/edit#pako:eNqVldtO20AQhl9lZAkEKiE-BEi4C3GASASlJLRqxc1ib-wBZ9faXRMixFP0tu_R-z5Kn6TjQw5USSi-iTfj_eaf0-6LFciQW6dWxIQxdwLoMWgSDgMlH3hgYIQTnqDgpS1khp9LNWEG4Bs9tX6_5vuljT2jntt27mEnvBOlQRMHpYAL2gxOzecBalrr0mo7C19DbrIUduFCSfrtSGEUo7___PwBpxBKwQ_Atd3jmt2q2Y0DcMKK4ILPDLtnmkMnlhhw8FEHmc69vL_bI38sjXE8g7YKYjQkJVOcFgbH5F-vR5wsEW8CdGvDgI3HMpnzG0t1PtcYCYqwjPQ9rn0E1_zZHD5o-AQjhskURQid4ZCWOmZhIOoZ_i_rGM5Y8MgJ8Dbde3MXNzIj-ZdMhAlXuhCpniiZev99-AmMZikfBgpT4hqFhKf6jTHKFDMby7CKaEJ3eIXCUGwDxY1Brj6KaMEgYbOpwig20HW7MOLaoIjW7zym92qnY8MFmsvsHtpFJTV0evWOD1-lehwncvqxDvBq55zlLVR1uOMsUt8e9Cix7czEXBgMtsTVWlHnwrmiYcgBtz1qoieeyHRCBNhreTvw-xe4zbpn5y-hpHj3CUeNi0__AL050IMBuc4BX5BPi1Izav21SpzGipIG9HlIuhO4loZrmKKJiaHxHhM0s3JmZQJ7rlPoOqq7ja2yXHeZROcIzhIZPAYxQ0GVoNbTcCWjaFMJXXtF2jEM3AHNi5lS0aA3SROep2hzild3v6lfo9ajZEdl11X0E7jV1JA3MuH5aFTiFuHaRbR23S2KYGQo1wbrrehtwpBi5eYQJZwpSdPMymZdwhpbYc0N7XdEJ2xCn6pZ5am1mINd-JyxolBtrWmsBB2VS3cnW92tNCRF6csgW6Z3F266bb_fpX4sYF7da7wHm2t38_Of6wWLFimrJn6pzduG86pKWgdWpDC0To3K-IE14XQZ5Uvr5ZVMKRPfpZzMrXTHRLF1OmaJplWW5lebj4zKXn3y-heaYDD6)** (pako/zlib-compressed, verified to round-trip).

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
