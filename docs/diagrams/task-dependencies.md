# Task Dependency Graph

_Auto-generated from the draft tasks in `docs/draft_tasks/`. Do not edit by hand._

Open in **[Mermaid Live](https://mermaid.live/edit#pako:eNqFV91O40YUfpWjIBCoBDL-SZxUqhQIyyLtrlLCtlJLL8b2OJnFeKKZMWm02qfobd-j932UPknPJLaTHFzKDfI35zu_3xyGr51EpaIz6mS5WiULri08TB4LwJ_jY5ipXKbAtVYrGEO3-wNcjeAKUrEURWpAFYiexrlKnkQK8RrGZw11oqxFMJeFcNQL0CLnDrnoOidj4EWKrrgW9UlDvVa50mYEcy1EAalCD3__BXFeCpAFLLXCA2MclnKzQJdzzddgVargtFAWjMUyRFrlYsoYz5cLzDqRRqrC_PrYucWAwLqTGnrs_La1fugxPO4xmGr1RSQWZsKWSziBW63w97UqrOYI__PnH3scz3E8mHDLY24EXC-UTARMpElK4wIQe9_Z--gT85IZ9k0nC2kxXIntGGsrM4xhDkjYcFKPSXiWqTyty_G6swrZixS4SMEus4kwcl5gPdu6DtMKnXEIn8Tv9uKLge_ggct8JXFQ17MZfpoFT5PispSt7L5j9-GKoxqQctjA09rpvSox1_c4_Vxos0lEv2CzzBlxN3DuBvCwXopZouUSPVkt0SHOIJPzUnP7urGRI0VwM_sgC4sZT7WwVgr9JmnoSEOY5ny90nK-sHDj3cCDMFYW80Nb1kNb1oNbad-XMYwT587A9d3l9QR-VvrJXaP_mVsmuJtzI0O_-65C9uI4FTLWNHM8vcNWjUu7EIWVSUsVzGmQefBOo0Qd5fMdDvtF5Gr5jBw4HfrH7sp40aXf29wdhdWd7TlwomQ-TNG5I_wkxWozHo7iJLGcqlgAH0WKueTwSVlhYCXtAllGxjKXdr29KyqHU49tIoeXXtAa2MmOhXDl9giuILzj4yRxN_yDms9fj8DpjPVh6k1RqXaFTYe752UuXJmvG_O6_6gMMd8KoR5B0L3bgXuhnAbZAD4bVNC9yoXTa5VbU11vU1zv0tt01W2h_dqcIFmEixTnaC-kgiut8BLxrbZ25OA1-XXmqcjli9DrOu0QF9gW2Yvo1MyGjXxP4MeSb-YxNgb1X-Be2oUdtOTsOY1jNROVlLuensD9zXjy8QaFtCH7l37QRnbC9dz6FKbh4seSV1dvF9t_o2Rcw5s_N7haKeA3S5cCtUVALRrAp0BNCalFAwQV0G-W5H8Bg2YRUqC2iJrdRoHaYkh9DCmlASIKVD5Yj1jsgAEF-hSoqmWMUhilMBrWoxSPUjwaxW-2HQU8AjSUgFICSgkoJaSJhTSxsNlEFdCnFn0adkDDNoBPgYACdR4RtWiAPgU8CtQ-hjT1IfXRABEBavF7vWZ1VEAzWwrgViAWPnna7bw58uERe-NouNc-chTslUiOor3M29NIcm7MRGTbZ2Qm83x0lCYiTaJzg_v7SYyOwjCKvew8ca_O0RGLQ9FCdqu0YsdimMUNm4X9MOnV7F4aDDgj7M3LdEvONj8NOe7FIglrchj0xYBXh133tsWXN1-PQgj2PG4G56r5_hD02kC_DQzawLAN7LeBgzYwagOHLSA-nlrAtoqYt-07QdtKYkGraVtNrK0mvE5uSASM2sBhC4jXogVkNdg578y1TDsjq0tx3nkW-pm7z87Xb3i05MUvSj3Xp_hvxnzRGWU8N_hVLlOU9ERyfABUJt_-BSvs9Z0)** (pako/zlib-compressed, verified to round-trip).

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
