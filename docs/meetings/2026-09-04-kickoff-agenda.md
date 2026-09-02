# Kickoff Meeting — Friday Sep 4

**Purpose:** Decide everything we need before writing code. Leave with clear roles, tech choices, and the first tasks assigned.

**Team:**
- `Kassim10` — Kassim Segerberg
- `rcilomba` — Ramadan
- `umoraghad0-del` — Najma Hasan
- `matdevstamp` — Matias Marti (Lead)

---

## Come Prepared

This is a git-first project. Come to the meeting having already:

### 1. Set up your machine

```bash
# Clone and explore
 git clone https://github.com/matdevstamp/inl-3-awesome-journal.git
cd inl-3-awesome-journal
ls docs/draft_tasks/          # see the 21 planned tasks
cat docs/Raw_Requirements.txt # the actual assignment
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

- `docs/Raw_Requirements.txt` — the actual assignment, scope authority
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

**→ Decision:** _______________

### CSS / UI Library
| Option | Pros | Cons |
|--------|------|------|
| **Tailwind + shadcn/ui** (recommended) | Accessible components, copies into project, works with React | React-only |
| **Tailwind + Headless UI** | Works with React AND Vue | Less polished defaults |
| **Plain CSS / CSS Modules** | No dependency | Slow to build UI |

**→ Decision:** _______________

### Backend
| Option | Pros | Cons |
|--------|------|------|
| **Express.js** (recommended) | Simple, everyone knows it, huge middleware ecosystem | Minimal structure |
| **NestJS** | Structured, enterprise-style | Heavy overhead for a school project |

**→ Decision:** _______________

### Authentication
| Option | Pros | Cons |
|--------|------|------|
| **JWT (tokens)** (recommended) | Stateless, simple, works with P2P | No server-side revocation |
| **Session cookies** | Server-side revocation, simpler mental model | Needs shared session store for P2P |
| **Passwordless / magic link** | Modern UX | Extra email service, more complex |

**→ Decision:** _______________

### Database
| Option | Pros | Cons |
|--------|------|------|
| **PostgreSQL** (recommended) | Production-grade, two-server P2P works naturally, Prisma supports it | Needs Docker or install |
| **SQLite** | Zero setup, file-based | Can't share between two servers easily |
| **PostgreSQL (prod) + SQLite (dev)** | Best of both | Migration differences possible |

**→ Decision:** _______________

### Build Tool
| Option | Pros | Cons |
|--------|------|------|
| **Vite** (recommended) | Fast, modern, great React/Vue support | Newer, less battle-tested |
| **Next.js** | Full-stack, SSR, great DX | Opinionated, heavier, may be overkill |

**→ Decision:** _______________

### Blockchain Library
| Option | Pros | Cons |
|--------|------|------|
| **Simple custom chain** (recommended) | Full control, teaches the concept, no heavy deps | Must implement hashing ourselves |
| **Chain.js / similar** | Ready-made | Heavy, may be overkill for access logs |

**→ Decision:** _______________

---

## 2. Repository & Workflow Rules (10 min)

Confirm everyone understands:

- **No direct pushes to `main`** — every change goes through a PR
- Branch naming: `feature/<task-id>-<topic>` or `chore/<task-id>-<topic>`
- PR requires **at least 1 review** before merge
- Meeting notes go in `docs/meetings/`
- Task planning lives in `docs/draft_tasks/`

**→ Confirm:** Everyone can push to the repo?

---

## 3. Roles & Streams (10 min)

Map real people to the four streams. **Tentative — adjust based on interest/skill.**

| Stream | What it covers | Owner |
|--------|---------------|-------|
| **A — Identity** | Auth, login, roles, session management | TBD |
| **B — Patient access** | Patient search, journal view, role-based display | TBD |
| **C — Notes & records** | Medical notes, visibility control, CRUD | TBD |
| **D — Audit & P2P** | Blockchain access logs, two servers, Socket.IO | TBD |

**Who does frontend scaffold (Vite + Tailwind + components)?** → pairs with backend person

**→ Record final mapping here:**

| GitHub username | Real name | Stream | Role |
|----------------|-----------|--------|------|
| Kassim10 | Kassim Segerberg | | |
| rcilomba | Ramadan | | |
| umoraghad0-del | Najma Hasan | | |
| matdevstamp | Matias Marti | — | Lead |

---

## 4. Group Contract & Availability (10 min)

**First:** Everyone confirms their availability in `docs/team-availability.md`.

**Then** agree on:

- [ ] Meeting schedule: **when** and **how often**? (minimum 2x/week required)
- [ ] Communication channel: Microsoft Teams ✓
- [ ] Definition of done: PR merged + test passes + meeting note updated?
- [ ] Branch protection: enforce PR reviews on `main`?
- [ ] How to handle disagreements?

**→ Sign the contract today or by Saturday morning.**

---

## 5. Gate 1 Tasks — This Week (10 min)

These are due by **Saturday Sep 5**:

| Task | Issue | Owner | Due |
|------|-------|-------|-----|
| Project setup & group contract | #1 | `matdevstamp` (lead) | Fri Sep 4 |
| Database choice | #2 | Team | Fri Sep 4 |
| Graphify architecture artifacts | #3 | TBD (assign in meeting) | Sat Sep 5 |
| Database schema design (DBML + Prisma) | #4 | TBD (assign in meeting) | Sun Sep 6 |

**What "done" looks like for Gate 1:**
- ✅ Contract signed
- ✅ Database choice documented
- ✅ Graphify artifacts in `graphify-out/`
- ✅ Three Mermaid diagrams in `docs/diagrams/`
- ✅ README skeleton with project description

---

## 6. First Requirements Checkpoint (5 min)

Open `docs/Raw_Requirements.txt` together. For each section, mark:

| Requirement | Status | Notes |
|-------------|--------|-------|
| Frontend/UI in framework | Covered? | Which framework? |
| Login page | Covered? | Which auth method? |
| 5 user roles | Covered? | How to seed test users? |
| Patient view with role-based display | Covered? | |
| Access logs on blockchain | Covered? | Which library? |
| P2P with 2 servers + Socket.IO | Covered? | |
| Min 2 meetings/week documented | Covered? | |
| Group contract | Covered? | Signing today |
| PR-only workflow | Covered? | Branch protection rules |

---

## 7. Next Steps & Close (5 min)

- [ ] **Next meeting:** When? (suggest Sunday or Monday)
- [ ] **Who facilitates next time?**
- [ ] **Who takes notes next time?**
- [ ] **Any blockers before we start?**

---

## Decisions Made Today

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend framework | | |
| CSS / UI library | | |
| Backend framework | | |
| Auth method | | |
| Database | | |
| Build tool | | |
| Blockchain library | | |
| Meeting schedule | | |

---

## Action Items

| Action | Owner | Due |
|--------|-------|-----|
| | | |
| | | |
| | | |
