# HealthAccess — Medical Records with Blockchain Access Logging

Medicinska journaler lagras i en SQL-databas. Varje gång någon tittar på
patientuppgifter genereras en **access log** som läggs på en blockkedja och
distribueras mellan två körande servrar — så att ingen kan titta eller radera
loggar i efterhand (GDPR-kravet om att patienter ska kunna se vem som har
öppnat deras journal).

**Kurs:** Inl 3 – Grupparbete · **Deadline:** fredag 2 oktober 2026 kl. 11.00

[![PR Validation](https://github.com/matdevstamp/inl-3-awesome-journal/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/matdevstamp/inl-3-awesome-journal/actions/workflows/pr-validation.yml)

## Privacy boundary (viktigt)

- Medicinska uppgifter lagras **endast i SQL-databasen** — aldrig på blockkedjan.
- Endast **access-loggar** representeras på blockkedjan.
- Rollbaserad åtkomst och access logs kontrolleras i kod och process.

## Team

| Namn | GitHub | Roll |
|---|---|---|
| Matias Marti | [`matdevstamp`](https://github.com/matdevstamp) | Koordinator/Lead, Gate 2-setup, docs |
| Kassim Segerberg | [`Kassim10`](https://github.com/Kassim10) | Backend (Next.js-routes, DB/Prisma, auth, `auditLogger`) |
| Ramadan | [`rcilomba`](https://github.com/rcilomba) | UI/Frontend (alla vyer, shadcn/ui) |
| Najma Hasan | [`umoraghad0-del`](https://github.com/umoraghad0-del) | Blockchain/access-logging (Stream D, task 15); pair P2P (16) & Socket.IO (18) |

## Stack

- **Frontend + backend:** fullstack Next.js (React + route handlers i samma
  TypeScript-app), kört två gånger på port **3001** och **3002** för P2P-demon
- **UI:** Tailwind CSS + shadcn/ui
- **Auth:** JWT i httpOnly cookie, 5 användarroller
- **DB:** PostgreSQL via Prisma (schema = enda källan, Mermaid-ER genereras)
- **Realtid/P2P:** Socket.IO för broadcast mellan servrarna
- **Access-log:** enkel egen blockkedja (custom chain)

## Kom igång (Setup)

**Förkrav:** Node 22+, npm, och antingen Docker eller en lokal PostgreSQL 16.

```bash
npm ci                 # installera beroenden (genererar även Prisma-klienten)
cp .env.example .env   # justera vid behov
npm run db:up          # startar lokal Postgres i Docker (idempotent)
npm run db:migrate     # skapar tabellerna (migrate dev)
npm run db:seed        # fyller i testdata (users: *test / lösenord: test123)
npm run dev            # server 1 på http://localhost:3001
```

### Två servrar (P2P-demon)

Next.js 16 tillåter bara **en** `next dev` per projektmapp, så de två
serverinstanserna (3001 `hospital-s`, 3002 `ambulance-a`) körs som
produktionsservrar från en gemensam build:

```bash
npm run build
npm run start -- -p 3001 &   # SERVER_ID=hospital-s
npm run start -- -p 3002 &   # SERVER_ID=ambulance-a
```

`npm run test` gör exakt detta automatiskt (se Testing).

## Skript (npm)

| Kommando | Vad det gör |
|---|---|
| `dev` / `dev:server2` | utvecklingsserver på 3001 / 3002 |
| `build` / `start` | produktionsbuild / starta server |
| `lint` · `typecheck` · `format:check` | eslint · `tsc --noEmit` · prettier-check |
| `format` | prettier --write |
| `test` · `test:install` | Playwright-suite · installera chromium |
| `db:up` / `db:down` | starta / stoppa Postgres-container |
| `db:migrate` / `db:deploy` | migrationer (dev) / tillämpa sparade migrationer |
| `db:seed` | testdata (users, patient, journal, anteckning) |

## Testing (Playwright)

En suite för hela appen under `e2e/`, strukturerad per område (`auth/`,
`patients/`, `records/`, `notes/`, `access-logs/`, `blockchain/`) med fixtures
och helpers. Global setup startar Postgres (lokalt) och bygger appen; sedan
bootas **båda** serverinstanserna och de **2 smoke-testerna** körs (landningssida
+ `/api/health` på 3001 och 3002). Featurespecar ligger som `test.skip` tills
deras gate landar.

```bash
npm run test
```

Misslyckade tester sparar skärmbilder/traces under `test-results/` och en HTML-
rapport i `playwright-report/`.

## Kodkonventioner

- **TypeScript strict** — `noUncheckedIndexedAccess` med mera; `any` är varning.
  Delade API-typer bor i `src/lib/types/api.ts` (ingen genererad OpenAPI-klient).
- **Format:** Prettier (`.prettierrc`); eslint flat config i `eslint.config.mjs`.
- **Branchar:** `feature/<task-id>-<ämne>` eller `chore/<task-id>-<ämne>`.
- **PR:** all appkod går via PR + **1 review** (ruleset aktiv på `main`;
  ingen reviewar/mergar sin egen PR). `docs/` + `project_management/` pushas direkt.
- PR-mallen: [.github/pull_request_template.md](.github/pull_request_template.md).

## Databas & diagram

`prisma/schema.prisma` är **enda källan** för datamodellen (beslut på kickoff —
ingen DBML). En Mermaid-ER genereras automatiskt av `npx prisma generate`:

- [Data model (ER)](docs/diagrams/data-model.md) — *genererad, redigera ej för hand*

Migrations skapas via `npm run db:migrate` och sparas i `prisma/migrations/`.
Grunddatan är fiktiv (GDPR: inga journaler på blockkedjan, bara access-loggar).

## Dokument & länkar

- [Projektplan](docs/PROJECT_PLAN.md) — gates, deadlines, arbetssätt
- [Gruppkontrakt](gruppkontrakt.md) — roller, regler, signering (v0.3)
- [Raw requirements (kursuppgiften)](docs/Raw_Requirements.md) — scope-autoritet
- [Mötesanteckningar](docs/meetings/) — minst 2 dokumenterade möten/vecka
- [Tillgänglighet & mötestider](docs/team-availability.md)
- [Loggböcker](docs/logbooks/) — en CSV per person
- [Bug reports](docs/bug-reports.csv) + [bug-arbetsflöde](docs/BUG_REPORTING.md)
- [Arkitektur-review (graphify)](docs/ARCHITECTURE_REVIEW.md) — 2026-09-04
- [Diagram](docs/diagrams/) — se nedan

### Graphify-artefakter (auto-genererade, commitas)

- [Interaktiv graf](graphify-out/graph.html) — öppna i webbläsaren
- [GRAPH_REPORT.md](graphify-out/GRAPH_REPORT.md) — rapport med communities/god nodes

Graphify-körningen görs med `graphifyy` 0.9.47 (strukturell AST-extrahering;
dokument/semantisk lager kräver en Gemini-nyckel). Bara `graph.html` +
`GRAPH_REPORT.md` commitas — `graph.json`, cache och mellanfiler ignoreras
(se `.gitignore`). Körs om före inlämning (se [ARKITEKTUR-REVIEW](docs/ARCHITECTURE_REVIEW.md)).

### Diagram

- [Systemkontext](docs/diagrams/system-context.md) — aktörer, två servrar, DB, kedja
- [Dataflöde](docs/diagrams/data-flow.md) — SQL-data vs access-log-kedjan
- [Sekvens: access-log](docs/diagrams/sequence-access-log.md) — tillåten läsning & loggspridning
- [Data model (ER)](docs/diagrams/data-model.md) — genererad från Prisma-schemat
- [Task dependency graph](docs/diagrams/task-dependencies.md) (auto-genererad)
- [Task gantt](docs/diagrams/task-gantt.md) (auto-genererad)
genererat från Prisma-schemat (task 04), API-dokumentation, skärmbilder,
`graphify-out/graph.html` + `GRAPH_REPORT.md` (task 03), demo-manus.

## Arbetsflöde (kort)

- App-kod (Next.js/TS, Prisma, config) → **PR med ≥1 review** — ingen slår
  ihop sin egen PR, inte heller lead.
- Allt under `docs/` + Python-verktyget (`project_management/`) → direkt push.
- GitHub-ruleset + PR-mall aktiveras med task 10 (före första app-kod-PR).

## Status

- **Pågående fas:** Gate 1 (tasks 01–03, beslut + repo-hygien) — wraps måndag 7 sep
- Därefter: Gate 2 scaffold (tasks 04–10) t.o.m. tisdag 8 sep, features startar onsdag 9 sep
