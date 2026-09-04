# Kickoff Meeting — Friday Sep 4

**Purpose:** Decide everything we need before writing code. Leave with clear roles, tech choices, and the first tasks assigned.

**Team:**
- `Kassim10` — Kassim Segerberg
- `rcilomba` — Ramadan
- `umoraghad0-del` — Najma Hasan
- `matdevstamp` — Matias Marti (Lead)

> **Outcome:** Kickoff held Fri Sep 4. Najma (`umoraghad0-del`) could not attend — open scopes below are pending her input. Roles/stream scopes are deliberately left loose (see Section 3).

---

## Come Prepared

This is a git-first project. Come to the meeting having already:

### 1. Set up your machine

```bash
# Clone and explore
 git clone https://github.com/matdevstamp/inl-3-awesome-journal.git
cd inl-3-awesome-journal
ls docs/draft_tasks/          # see the 21 planned tasks
cat docs/Raw_Requirements.md # the actual assignment
cat docs/PROJECT_PLAN.md      # the timeline and gates

# Install toolchain
node --version      # need 20+
python3 --version   # need 3.11+
git --version
git --version
git --version
gh --version        # GitHub CLI — brew install gh / apt install gh
gh auth login       # authenticate before the meeting

# Try the project management CLI
python3 -m project_management status           # see open issues
python3 -m project_management plan show         # see all tasks with deadlines
python3 -m project_management plan kickoff      # see who's assigned to what
python3 -m project_management plan check        # check for schedule problems
```

### 2. Think about yourself

Come ready to share briefly (1–2 min each):

- **What are you good at?** Frontend? Backend? DevOps? Database? UI design? Testing? Writing docs? Something else?
- **What do you want to learn?** This project is a chance to grow — what skill do you want to pick up?
- **How do you work best?** Solo deep-dive? Pair programming? Small group? Do you prefer having a clear spec or figuring things out?
- **When do you do your best work?** Mornings? Late nights? Weekends?
- **Any concerns?** Time constraints, tools you haven't used, things you're worried about — better to surface them now.

### 3. Fill in your availability

Open `docs/team-availability.md` and mark each day:
- `AM`, `PM`, `EVE`, `ALL`, `—` (not available), or `WORK` (coding that day)
- This is how we find meeting slots that work for everyone

### 4. Read these files

- `docs/Raw_Requirements.md` — the actual assignment, scope authority
- `docs/PROJECT_PLAN.md` — timeline, gates, dependency flow
- `docs/draft_tasks/` — browse the 21 planned tasks
- `docs/meetings/2026-09-04-kickoff-agenda.md` — this file

---

## 0. Setup Check + Intros (10 min)

Quick round — does everyone have these installed and working?

```bash
node --version && python3 --version && git --version && gh --version
```

If not, pair-install now.

Then go around the room — everyone shares (1–2 min each):
- What you're good at
- What you want to learn this month
- How you work best (pair? solo? mornings? nights?)
- Any concerns or constraints

---

## 1. Tech Stack Decisions (20 min)

Vote on each. Lead breaks ties.

### Frontend Framework
| Option | Pros | Cons |
|--------|------|------|
| **React** (recommended) | Huge ecosystem, most tutorials, shadcn/ui available | Heavier bundle |
| **Vue 3** | Simpler API, good docs, lighter | Smaller ecosystem, fewer UI libraries |
| **Svelte** | Fastest, smallest bundles, clean syntax | Smallest community |

**→ Decision:** **React** — but as part of the **Next.js fullstack** choice below, not a separate Vite SPA. Deviates from the agenda default split.

### CSS / UI Library
| Option | Pros | Cons |
|--------|------|------|
| **Tailwind + shadcn/ui** (recommended) | Accessible components, copies into project, works with React | React-only |
| **Tailwind + Headless UI** | Works with React AND Vue | Less polished defaults |
| **Plain CSS / CSS Modules** | No dependency | Slow to build UI |

**→ Decision:** **Tailwind + shadcn/ui** (pre-styled, repo-owned components on Radix; standard React/Next pairing). Ramadan owns the styling layer.

### Backend
| Option | Pros | Cons |
|--------|------|------|
| **Express.js** (recommended) | Simple, everyone knows it, huge middleware ecosystem | Minimal structure |
| **NestJS** | Structured, enterprise-style | Heavy overhead for a school project |

**→ Decision:** **No separate backend framework — Next.js fullstack** (API routes inside Next.js). Two fullstack servers total for the P2P demo, instead of two backends + one frontend. Express and Nest both dropped.

### Authentication
| Option | Pros | Cons |
|--------|------|------|
| **JWT (tokens)** (recommended) | Stateless, simple, works with P2P | No server-side revocation |
| **Session cookies** | Server-side revocation, simpler mental model | Needs shared session store for P2P |
| **Passwordless / magic link** | Modern UX | Extra email service, more complex |

**→ Decision:** **JWT in an httpOnly cookie**, routes guarded via Next.js middleware. Not Auth.js — full control over the 5-role enum, no shared session store needed for P2P.

### Database
| Option | Pros | Cons |
|--------|------|------|
| **PostgreSQL** (recommended) | Production-grade, two-server P2P works naturally, Prisma supports it | Needs Docker or install |
| **SQLite** | Zero setup, file-based | Can't share between two servers easily |
| **PostgreSQL (prod) + SQLite (dev)** | Best of both | Migration differences possible |

**→ Decision:** **PostgreSQL** for dev and prod alike — two fullstack servers share it, matching the two-server P2P requirement.

### Build Tool
| Option | Pros | Cons |
|--------|------|------|
| **Vite** (recommended) | Fast, modern, great React/Vue support | Newer, less battle-tested |
| **Next.js** | Full-stack, SSR, great DX | Opinionated, heavier, may be overkill |

**→ Decision:** **Next.js** — merged with the backend choice: one fullstack framework per server (see Backend decision). Vite dropped; draft tasks 05/06/12 must be reconciled with this (action item).

### Blockchain Library
| Option | Pros | Cons |
|--------|------|------|
| **Simple custom chain** (recommended) | Full control, teaches the concept, no heavy deps | Must implement hashing ourselves |
| **Chain.js / similar** | Ready-made | Heavy, may be overkill for access logs |

**→ Decision:** **Simple custom chain** (hash-linked blocks, key signing, Merkle/verification as needed) — no external blockchain library.

---

## 2. Repository & Workflow Rules (10 min)

Confirm everyone understands:

- **No direct pushes to `main`** — every change goes through a PR
- Branch naming: `feature/<task-id>-<topic>` or `chore/<task-id>-<topic>`
- PR requires **at least 1 review** before merge
- Meeting notes go in `docs/meetings/`
- Task planning lives in `docs/draft_tasks/`
- **Direct-to-main rule (decided):** everything under `docs/` (markdown, CSVs, diagrams, `.mmd`, etc.) and the Python tooling (`project_management/`) may push to `main` directly; all app code (Next.js/TS, Prisma/DB schema, config) requires a PR + 1 review

**→ Confirm:** Everyone can push to the repo?

---

## 3. Roles & Streams (10 min)

Map real people to the streams. **Tentative — adjust based on interest/skill.** The four Person roles follow the example split in `docs/Raw_Requirements.md`:

| Person | Area (Raw Requirements example) | Streams |
|--------|-------------------------------|---------|
| Person 1 | Crypto & liggare — `Block`/`Blockchain` classes, key signing, Merkle tree, verification | D (chain core) |
| Person 2 | P2P-nätverk — server sync, audit-block distribution, longest-chain rule, Socket.IO | D (P2P/realtime) |
| Person 3 | Express API & middleware — routes, `auditLogger`, backend, databases | A/B/C (backend) |
| Person 4 | Front end — login, journal search/view, live access-log view, verification badge | A/B/C (frontend) |

| Stream | What it covers | Owner (Person + name) |
|--------|---------------|-------|
| **A — Identity** | Auth, login, roles, session management | Kassim (backend) · Ramadan (frontend) |
| **B — Patient access** | Patient search, journal view, role-based display | Kassim (backend) · Ramadan (frontend) |
| **C — Notes & records** | Medical notes, visibility control, CRUD | Kassim (backend) · Ramadan (frontend) |
| **D — Audit & P2P** | Blockchain access logs, two servers, Socket.IO | **Open** — chain core & P2P split TBD; Kassim may take chain core |

**Who does the scaffold (Next.js + Tailwind + shadcn/ui)?** → Ramadan (UI) pairing with Kassim (backend); Matias drives Gate 1–2 setup. Najma may join a pairing once she is back.

**→ Record final mapping here:**

| GitHub username | Real name | Person | Stream | Role |
|----------------|-----------|--------|--------|------|
| Kassim10 | Kassim Segerberg | — | A/B/C backend | **Backend** (API routes, DB/Prisma, middleware); stream D chain core open |
| rcilomba | Ramadan | — | A/B/C frontend | **UI / Frontend** (all UI incl. stream D view — TBD) |
| umoraghad0-del | Najma Hasan | — | unassigned | **Pair programming** — declares her own focus later |
| matdevstamp | Matias Marti | — | — | **Coordinator / Lead** — heavy focus on Gates 1–2 |

---

## 4. Group Contract, Logbook & Availability (10 min)

**First:** Everyone confirms their availability in `docs/team-availability.md`.

**Then** agree on:

- [ ] Meeting schedule: **pending** — everyone fills `docs/team-availability.md` first, then we book 2 fixed slots/week (see action items)
- [x] Logbook format: **per-member CSV in `docs/logbooks/`** (default, in-repo)
- [x] Communication channel: Microsoft Teams ✓
- [ ] Definition of done: PR merged + CI green + reviewer approved + meeting note updated? (confirm)
- [x] Branch protection: **special rule** — everything under `docs/` + Python tooling push to `main` directly; app code requires PR + 1 review
- [ ] How to handle disagreements? (open)

**→ Sign the contract today or by Saturday morning.**

---

## 5. Gate 1 Tasks — This Week (10 min)

Gate 1 wraps **Monday Sep 7** (01–02 finish at the kickoff on Fri Sep 4; the weekend is available if we want to close earlier):

| Task | Issue | Owner | Due |
|------|-------|-------|-----|
| Project setup & group contract | #1 | Team (`matdevstamp` coordinates) | Fri Sep 4 |
| Database choice | #2 | Team | Fri Sep 4 |
| Graphify architecture artifacts | #3 | Team (`matdevstamp` coordinates) | Mon Sep 7 |
| Database schema design (Prisma + generated Mermaid ER) | #4 | `matdevstamp` (schema/prisma setup) | Mon Sep 7 |

**What "done" looks like for Gate 1:**
- ✅ Contract signed
- ✅ Database choice documented
- ✅ Graphify artifacts in `graphify-out/`
- ✅ Three Mermaid diagrams in `docs/diagrams/`
- ✅ README skeleton with project description

---

## 6. First Requirements Checkpoint (5 min)

Open `docs/Raw_Requirements.md` together. For each section, mark:

| Requirement | Status | Notes |
|-------------|--------|-------|
| Frontend/UI in framework | Covered (planned) | Next.js (React) |
| Login page | Covered (planned) | JWT in httpOnly cookie |
| 5 user roles | Unclear | How to seed test users? |
| Patient view with role-based display | Unclear | |
| Access logs on blockchain | Covered (planned) | Simple custom chain |
| P2P with 2 servers + Socket.IO | Covered (planned) | Two fullstack Next.js servers |
| Min 2 meetings/week documented | Unclear | Schedule pending availability |
| Group contract | Unclear | Signing today / Sat morning |
| PR-only workflow | Covered (planned) | Special rule: everything in `docs/` + Python direct; app code via PR |

---

## 7. Bug Reports and Red/Green Debugging (10 min)

Agree on this workflow before feature work starts:

1. Anyone records a new observation in `docs/bug-reports.csv` using fictional data only.
2. The lead triages the report: duplicate, cannot reproduce, expected behavior, or valid defect.
3. For a valid user-facing defect, the owner first writes a focused Playwright E2E test that reproduces it. The test should fail for the known reason: **red**.
4. The owner implements the smallest fix and reruns the test until it passes: **green**.
5. The owner adds or updates unit/integration tests where the defect crosses an API, policy, or data boundary.
6. The lead reviews the evidence, converts the report into a draft task, and creates the real GitHub issue only after triage.
7. The issue links back to the raw report and reproduction test. The PR explains the root cause, fix, and test result.

### Decisions to Make

- [ ] `docs/bug-reports.csv` is an append-only intake log, not the task board.
- [ ] The lead owns triage and may merge duplicate reports.
- [ ] No bug report contains names, personal numbers, medical content, passwords, tokens, or screenshots with sensitive data.
- [ ] A bug is not done because the symptom disappeared manually; the reproduction test must be green in CI.
- [ ] Severity, project status, priority, and assignee are managed in the project/task workflow, not improvised as duplicate labels.

### Friday Action Items

| Action | Owner | Due | Related task |
|---|---|---|---|
| Confirm the CSV fields and privacy rule | Team | Sep 4 | 01, 19 |
| Review the first raw report workflow with a fictional example | Lead | Sep 4 | 19 |
| Decide where Playwright reproduction tests live | `matdevstamp` (pairs: `rcilomba`) | Sep 5 | 09 |

---

## 8. Meeting Scope Policy (5 min)

Agree to protect the purpose of each meeting. The facilitator may say:

> This is a longer discussion. Let us park it, record the decision needed, and book a separate meeting with the right people.

Use the parking lot in `docs/MEETING_TEMPLATE.md` for topics that need more time, different participants, or preparation. Do not park an urgent blocker or a decision required to complete the current agenda.

- [ ] Facilitator owns keeping the meeting on scope.
- [ ] Note-taker records parked topics, owner, participants, and decision needed.
- [ ] Lead books a separate meeting when the topic is actionable.

## 9. Next Steps & Close (5 min)

- [ ] **Next meeting:** TBD this week — book once availability is filled (Gate 1 wraps Mon Sep 7)
- [ ] **Who facilitates next time?** TBD
- [ ] **Who takes notes next time?** TBD
- [ ] **Blockers:** availability not yet filled in; Najma absent (will pair + declare focus). Draft tasks 05–14/20 were reconciled to the Next.js fullstack decision after the kickoff.

---

## Decisions Made Today

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend framework | React (inside Next.js) | One fullstack framework per server |
| CSS / UI library | Tailwind + shadcn/ui | Pre-styled repo-owned components, fast UI work |
| Backend framework | None separate — Next.js API routes | 2 fullstack servers for P2P demo, not 2 backends + 1 frontend |
| Auth method | JWT in httpOnly cookie | Control over 5 roles; no shared session store for P2P |
| Database | PostgreSQL (dev + prod) | Two servers share it; matches P2P requirement |
| Build tool | Next.js | Merged with backend choice; Vite dropped |
| Blockchain library | Simple custom chain | Teaches the concept; no heavy deps for access logs |
| PR reviews | Nobody merges/reviews their own PR — not even the lead | Matias's code is reviewed by whoever owns the area (Kassim backend, Ramadan UI); no review time-cap |
| Meeting schedule | Pending availability | Everyone fills `docs/team-availability.md`, then book 2x/week |

## Decisions Still Open

| Open decision | Owner | Due |
|---|---|---|
| Stream D split (chain core vs P2P) | Kassim + Matias (lead) | Before Gate 3 features start (Wed Sep 9) |
| Najma's focus area | Najma (declares herself) | Before Gate 3 features start (Wed Sep 9) |
| Meeting slots (2x/week) | Everyone (availability) | This week |
| Disagreement handling | Team | Before signing |

---

## Action Items

| Action | Owner | Due |
|--------|-------|-----|
| Fill in `docs/team-availability.md` | Everyone (all 4) | ASAP, before next meeting |
| Sign `gruppkontrakt.md` | Everyone | Today / Sat Sep 5 morning |
| #3 Graphify artifacts + Mermaid diagrams | Team (`matdevstamp` coordinates) | Mon Sep 7 |
| #4 Database schema (Prisma + generated Mermaid ER) | `matdevstamp` | Mon Sep 7 |
| Gate 2 setup (tasks 05–10: Next.js scaffold, TS, ESLint, Playwright, CI) | `matdevstamp` (pairs where needed) | By Tue Sep 8 |
| Feature tasks 11–14, 17 owners per stream (Kassim backend · Ramadan UI) | see draft tasks | Gate 3–4 (Sep 9–21) |
| Declare focus area + join a pairing | Najma | Before Gate 3 features start (Wed Sep 9) |
| Apply branch-protection ruleset in GitHub (docs/ + Python → direct; app code → PR + 1 review) | Lead (`matdevstamp`) | Later — before first app-code PR (ties into #1/#10) |
