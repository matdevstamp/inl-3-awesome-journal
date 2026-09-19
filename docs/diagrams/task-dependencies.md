# Task Dependency Graph

_Auto-generated from the draft tasks in `docs/draft_tasks/`. Do not edit by hand._

Open in **[Mermaid Live](https://mermaid.live/edit#pako:eJx9Vs2O2zYQvvcpBgqy2CDxLklJtrQFCnjXm80CSeDGTnoQeqCosc2sKhokFdfP0Wvfo_c-Sp-kkCzKa1qJb983880fqTFXpdqJDdcWlrOfAABevoSFKmUBXGu1gymMRr_A7Q3cQoFbrAoDqoIpXOalEk9YQL6H6SunnClrsYBSVtgor0BjyRvmatTEmAKvCrgFrtFZnPJOlUqbG1hrxAoKVSH8-w_kZY0gK9hqtdZoTMMV3GywgLXme7CqUHBZKQvGcm2xOFRi6nyt-XYDBQpppKpMFjxwi0BHM8cEv7euS0KzgFCYa_UVhYUF2noLF_CgVb2FO1VZzYWF__7-qxewLCAMZtzynBuEu42SAmEmjahNE_rEOcwCEsJDU41c7WGqxUZaFLbWCFNt5YoLa54psCpOWzCCr1aqLLoO2GjREX2KKAtIdKxnhkauK7joWnleTJwFJIaP-Ke9-mrgNSy5LHeyKuBusYDXYDa8ENV1LQek4ywgY7jl4gmrwpvWpYv4SdUW4R2vihK1aUvQ36RA8-ok1iQLyASW-y0uhJZbCwurpbDNtFdyXWtu_SkmWUASuF-8l5WF1zDXaK1E_QNFmgUkhXnJ9zst1xsL9-welmisrNbPHSnJAkrgQdp3dQ5T0QQycPd4fTeD35R-WpVq96PjWSFvztJdsHD0tiP6BDQLKO0nN50_wgVMa7vBykpxVjhlWUAZvNWqso3_50eY4Tcs1fYPrCxcpuHL5iNgyXVI2q9ByWr9qleHWUBDmHMrG-8vEnftKXAtNidZoiygEXzAQgpewkdl0cBO2g18kUbmspR2f7j8qoRLRtuc8TWLBlLGWUBjuG3WgdhwWcFUiOZTfa_Wa3_Y4yygY5izOXxEu1P6CR7_2JbYtOZP4mzSsrK4Ppx0N-xo9Hjk-hyTLKAT-GxQwydVYnMNu4r6hkjbD7lm7QibJXJsJ8kCmsCiWW72Siq41YoXgh8uzlEZ-cqzegss5TfU-67YeDTriD5VmgU07S_lBfxa83bwU2NqzSuBz_JNziplJAsYgZkS9XF-F_Dpfjr7cA-XaasMr8OzSpeMZgFrVh6aXjjXuOXdd3TMGn6vyyWh7R_DkjAPh25LetjZI8_ucOhh5x97doejDo_dbvsOnrgF5mFnT9xS8rCzp54-9fwdTjzc6Sk5tfd44uGxh7v-KPX8qedPvXzM82eeP_Pih25NeZid4t4_8vwjzz_y_GOvntirJ3ZrpMNjzz728k28fA6HHo487PInnt3hsYeZh50-9epNPb3DySl295kR9_F32J2fhxnx7KH3nOojNcpTC_2-JT1Oy7NEx748S3KseLACUXJjZrg6vNpWsixvXhQCC5G8MVarJ7x5EcdJzlZvRPPIu3lB8xjPtc0O7MQ5pqu8F9N4HAvixKSIJpyeittn4EG7an-9Nic5ithp42iME94ZR81DkmvN9zcxRMeA7Vk1rfx8wrEBLhzgogEuHuDGA9xkgEsGuPSco2SAG-iDssOoT8mBRmg05DjQCR3ohE7aMznlkgEuPecYGeBox_0PINFq-Q)** (pako/zlib-compressed, verified to round-trip).

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
    T01["01 Project Setup & Group Contract ✓"]
    T02["02 Database Choice Discussion ✓"]
    T03["03 Graphify Architecture Artifacts ✓"]
    end
    subgraph scaffold["Gate 2-Scaffold"]
    T04["04 Database Design & Setup ✓"]
    T05["05 Next.js + Tailwind CSS + shadcn/ui Setup ✓"]
    T06["06 Backend Project Setup (Next.js Route Handlers & Services) ✓"]
    T07["07 TypeScript Strict Configuration ✓"]
    T08["08 ESLint + Prettier Configuration ✓"]
    T09["09 Playwright E2E Testing ✓"]
    T10["10 GitHub Actions CI/CD Workflow ✓"]
    end
    subgraph features["Gate 3-Features"]
    T11["11 Backend API & Authentication ✓"]
    T12["12 Frontend UI Development (93% · 28/30 · doing)"]
    T13["13 Patient View & Search ✓"]
    T14["14 Medical Notes with Visibility Control (21% · 5/24 · doing)"]
    T15["15 Blockchain Access Logging ✓"]
    T16["16 P2P Network Implementation ✓"]
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
    class T01 done;
    class T02 done;
    class T03 done;
    class T04 done;
    class T05 done;
    class T06 done;
    class T07 done;
    class T08 done;
    class T09 done;
    class T10 done;
    class T11 done;
    class T12 doing;
    class T13 done;
    class T14 doing;
    class T15 done;
    class T16 done;
    class T17 todo;
    class T18 todo;
    class T19 todo;
    class T20 todo;
    class T21 todo;
```
