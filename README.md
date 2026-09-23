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
| Kassim Segerberg | [`Kassim10`](https://github.com/Kassim10) | Backend (Task 11, Task 14), dokumentation och presentation (Task 20, Task 21) |
| Ramadan | [`rcilomba`](https://github.com/rcilomba) | UI/Frontend (alla vyer, shadcn/ui), Task 18 |
| Najma Hasan | [`umoraghad0-del`](https://github.com/umoraghad0-del) | Roller och åtkomstkontroll, Task 17 |

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
SERVER_ID=hospital-s npm run start -- -p 3001 &    # peer: 3002
SERVER_ID=ambulance-a npm run start -- -p 3002 &   # peer: 3001
```

`PEER_URL` pekar automatiskt på den andra instansen utifrån `SERVER_ID`
(eller sätts explicit). `PEER_HEARTBEAT_MS` styr hur ofta servrarna pingar
varandra (default 10 s).

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

Projektet använder Playwright för E2E-testning under `e2e/`. Testerna är organiserade efter funktioner som autentisering, patienter, journaler, medicinska anteckningar, access-loggar och blockchain.

Testerna verifierar bland annat autentisering, rollbaserad åtkomst, patient- och journalflöden, medicinska anteckningar, access-loggar och två-server-funktionalitet.

Kör hela testsviten med:

`npm run test`

Misslyckade tester sparar skärmbilder och traces under `test-results/` och en HTML-rapport i `playwright-report/`.

Om Playwright saknar Chromium kan webbläsaren installeras med:

`npm run test:install`

### Demo-flöde

1. Öppna `http://localhost:3001`.
2. Logga in som **Doctor**.
3. Sök efter patienten **Anna Andersson**.
4. Öppna patientens journal.
5. Skapa en medicinsk anteckning med synligheten `healthcare`.
6. Öppna `http://localhost:3002`.
7. Logga in som **Nurse**.
8. Öppna samma patient och kontrollera att anteckningen visas.
9. Visa att access-loggen registrerar åtkomsten.
10. Logga in som **Patient**.
11. Kontrollera att patienten endast kan se sin egen information och att
    synlighetsreglerna för anteckningar följs.
12. Logga in som **Unauthorized**.
13. Kontrollera att användaren nekas åtkomst till skyddade resurser.
14. Öppna access-loggen och visa att blockchain-kedjan är giltig.
15. Visa att access-loggar kan synkroniseras mellan de två serverinstanserna.

### Privacy boundary

Under demon ska det vara tydligt att:

- patientens medicinska information lagras i SQL
- endast access-loggar representeras på blockkedjan
- åtkomst kontrolleras server-side med JWT och roller
- patienten får endast tillgång till sina egna uppgifter

## Felsökning

### Databasen startar inte

Kontrollera att Docker körs och starta PostgreSQL med `npm run db:up`.

Om databasen behöver stängas av använder du `npm run db:down`.

Om databasen saknar schema kör du `npm run db:migrate` och sedan `npm run db:seed`.

### Prisma-klienten saknas eller är inaktuell

Kör `npx prisma generate`.

### Port 3001 eller 3002 används redan

Kontrollera vilken process som använder porten med `lsof -i :3001` eller `lsof -i :3002`.

Stoppa processen och starta servern igen.

### Tester eller dependencies fungerar inte

Installera projektets dependencies med `npm ci`.

Kör sedan testerna med `npm run test`.

Om Playwright saknar Chromium kör du `npm run test:install`.

### Inloggning fungerar inte

Kontrollera att databasen är seedad med `npm run db:seed`.

Kontrollera även att `.env` är korrekt konfigurerad.

### Två-server-demo fungerar inte

Kontrollera att serverinstanserna körs på `http://localhost:3001` och `http://localhost:3002`.

För server 2 kan projektets script användas med `npm run dev:server2`.

Om P2P- eller Socket.IO-synkroniseringen inte fungerar, starta om båda serverinstanserna.

## Bug workflow

Buggar hanteras genom följande flöde:

1. **Raw intake** — buggen registreras utan patientdata, secrets eller annan känslig information.
2. **Lead triage** — ansvarig lead bedömer buggen och prioriterar den.
3. **Draft task** — buggen omvandlas till en konkret utvecklingsuppgift.
4. **E2E reproduction** — felet reproduceras med ett automatiserat E2E-test när det är möjligt.
5. **Red/green fix** — testet ska först visa felet och därefter passera efter fixen.
6. **Review evidence** — ändringen granskas och testresultat dokumenteras.
7. **Closure** — buggen stängs när fixen är verifierad och relevant dokumentation är uppdaterad.

Se [BUG_REPORTING.md](docs/BUG_REPORTING.md) för det fullständiga bug-arbetsflödet.

## Uppdatering av dokumentationen

README och projektets dokumentation ska uppdateras när nya funktioner, API-routes, databastabeller eller arbetsflöden införs.

Vid en större ändring ska relevant dokumentation uppdateras i samma arbetsflöde som koden. Det gäller exempelvis:

- `README.md` för installation, demo, scripts och övergripande projektinformation
- `docs/api/README.md` när API-routes eller API-kontrakt ändras
- `docs/database.md` när datamodellen eller migrationer ändras
- `docs/meetings/` för nya mötesanteckningar och requirements-checkpoints
- `docs/BUG_REPORTING.md` och bug-loggen för ändringar i bugghanteringen
- `docs/diagrams/` när arkitektur eller dataflöden förändras

Innan en task stängs ska relevant dokumentation vara uppdaterad och länkar i README:n kontrollerade.

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

- [CREATE-script / initial migration](prisma/migrations/20260904_init/migration.sql) — SQL för att skapa databasschemat
- [Databasdokumentation](docs/database.md) — tabeller, relationer, enums, index och seed-data

Grunddatan är fiktiv (GDPR: inga journaler på blockkedjan, bara access-loggar).

## Dokument & länkar

- [Projektplan](docs/PROJECT_PLAN.md) — gates, deadlines, arbetssätt
- [Gruppkontrakt](gruppkontrakt.md) — roller, regler, signering (v0.3)
- [Raw requirements (kursuppgiften)](docs/Raw_Requirements.md) — scope-autoritet
- [Mötesanteckningar](docs/meetings/) — minst 2 dokumenterade möten/vecka
- [Mötesmall](docs/MEETING_TEMPLATE.md) — används för facilitator, timekeeper, note-taker, deltagare, beslut, blockers, action items och requirements-checkpoint
- [Tillgänglighet & mötestider](docs/team-availability.md)
- [Loggböcker](docs/logbooks/) — en CSV per person
- [Bug reports](docs/bug-reports.csv) + [bug-arbetsflöde](docs/BUG_REPORTING.md)
- [Arkitektur-review (graphify)](docs/ARCHITECTURE_REVIEW.md) — 2026-09-04
- [Diagram](docs/diagrams/) — se nedan
- [Databasdokumentation](docs/database.md) — databasstruktur, relationer, seed-data och migrationer
- [API-dokumentation](docs/api/README.md) — endpoints, roller, autentisering och API-kontrakt

## API endpoints

| Method | Path | Purpose | Roles |
|---|---|---|---|
| POST | `/api/auth/login` | Logga in och skapa JWT-session | Alla roller |
| POST | `/api/auth/logout` | Logga ut och ta bort sessionen | Autentiserad |
| GET | `/api/auth/me` | Hämta aktuell användare | Autentiserad |
| GET | `/api/health` | Kontrollera API/serverstatus | Publik |
| GET | `/api/patients` | Söka och paginera patienter | doctor, nurse, ambulance |
| GET | `/api/patients/:id` | Hämta patient och journalvy | doctor, nurse, ambulance, patient |
| GET | `/api/notes?recordId={id}` | Hämta anteckningar för en journalpost enligt behörighet | doctor, nurse, ambulance, patient |
| POST | `/api/notes` | Skapa medicinsk anteckning | doctor, nurse, ambulance |
| PATCH | `/api/notes/:id` | Ändra en egen anteckning | doctor, nurse, ambulance |
| DELETE | `/api/notes/:id` | Ta bort en egen anteckning | doctor, nurse, ambulance |
| GET | `/api/access-log` | Visa access-loggar och kontrollera blockchainens giltighet | doctor, nurse, ambulance, patient |
| GET | `/api/p2p/access-log` | Hämta lokal blockchain-access-logg | P2P |
| POST | `/api/p2p/access-log` | Ta emot och validera access-logg från peer-server | P2P |

`GET /api/records` finns som route men är ännu inte implementerad och returnerar `501 Not Implemented`.

API-kontrakt och detaljerad dokumentation finns i [API-dokumentationen](docs/api/README.md).

Gemensamma TypeScript-typer finns i `src/lib/types/api.ts`. Projektet använder gemensamma typer mellan frontend och backend istället för en OpenAPI-genererad klient.

## Screenshots

### Inloggning

![HealthAccess login](public/images/login-healthcare.jpg)

### Vårdpersonal

![Doctors](public/images/doctors.jpg)

### Vårdpersonal – alternativ vy

![Doctors](public/images/doctors2.jpg)

### Sjukhus

![Hospital](public/images/hospital.jpg)

### Requirements traceability

| Krav | Implementation / task | Test eller demo | Ansvarig | Status |
|---|---|---|---|---|
| JWT-autentisering och Backend API | Task 11 | E2E-tester under `e2e/auth/` + API-demo | Kassim | Implementerat |
| Medicinska anteckningar med olika visibility-nivåer | Task 14 | E2E-tester under `e2e/notes/` + demo | Kassim | Implementerat |
| Roller och åtkomstkontroll | Task 17 | E2E-tester + rollbaserad demo | Najma | Implementerat |
| Realtidsbroadcasting mellan servrar | Task 18 | Två-server-demo på 3001/3002 | Ramadan | Implementerat |
| Dokumentation, README och API-dokumentation | Task 20 | `README.md` + `docs/api/README.md` + `docs/database.md` | Kassim | Pågående |
| Presentation och teknisk demo | Task 21 | Reproducerbart demo-flöde + presentation | Kassim | Pågående |
| Medicinsk information ska inte lagras på blockchain | Task 15 | Privacy boundary + blockchain-demo | Team | Implementerat |
| Access-loggar och blockchain-verifiering | Task 15 | Access-logg + blockchain-verifiering | Team | Implementerat |
| P2P-synkronisering mellan servrar | Task 16 | Två-server-demo på 3001/3002 | Team | Implementerat |
| Datamodell och PostgreSQL | Task 04 | `prisma/schema.prisma` + `docs/database.md` | Team | Implementerat |
| E2E-testning | Task 09 + Task 19 | `npm run test` | Team | Pågående |

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
