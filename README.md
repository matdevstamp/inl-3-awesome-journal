# HealthAccess — Medical Records with Blockchain Access Logging

Medicinska journaler lagras i en SQL-databas. Varje gång någon tittar på
patientuppgifter genereras en **access log** som läggs på en blockkedja och
distribueras mellan två körande servrar — så att ingen kan titta eller radera
loggar i efterhand (GDPR-kravet om att patienter ska kunna se vem som har
öppnat deras journal).

**Kurs:** Inl 3 – Grupparbete · **Deadline:** fredag 2 oktober 2026 kl. 11.00

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
| Najma Hasan | [`umoraghad0-del`](https://github.com/umoraghad0-del) | Pair programming — deklarerar fokus senare |

## Stack

- **Frontend + backend:** fullstack Next.js (React + route handlers i samma
  TypeScript-app), kört två gånger på port **3001** och **3002** för P2P-demon
- **UI:** Tailwind CSS + shadcn/ui
- **Auth:** JWT i httpOnly cookie, 5 användarroller
- **DB:** PostgreSQL via Prisma (schema = enda källan, Mermaid-ER genereras)
- **Realtid/P2P:** Socket.IO för broadcast mellan servrarna
- **Access-log:** enkel egen blockkedja (custom chain)

## Kom igång (Setup)

Installationsanvisningar läggs in med Gate 2 (tasks 04–10, planerad 7–8 sep).
Tills dess: `python3 -m project_management plan show` för aktuell status.

## Dokument & länkar

- [Projektplan](docs/PROJECT_PLAN.md) — gates, deadlines, arbetssätt
- [Gruppkontrakt](gruppkontrakt.md) — roller, regler, signering (v0.3)
- [Raw requirements (kursuppgiften)](docs/Raw_Requirements.md) — scope-autoritet
- [Mötesanteckningar](docs/meetings/) — minst 2 dokumenterade möten/vecka
- [Tillgänglighet & mötestider](docs/team-availability.md)
- [Loggböcker](docs/logbooks/) — en CSV per person
- [Bug reports](docs/bug-reports.csv) + [bug-arbetsflöde](docs/BUG_REPORTING.md)
- [Diagram](docs/diagrams/) — se nedan

### Diagram

- [Systemkontext](docs/diagrams/system-context.md) — aktörer, två servrar, DB, kedja
- [Dataflöde](docs/diagrams/data-flow.md) — SQL-data vs access-log-kedjan
- [Sekvens: access-log](docs/diagrams/sequence-access-log.md) — tillåten läsning & loggspridning
- [Task dependency graph](docs/diagrams/task-dependencies.md) (auto-genererad)
- [Task gantt](docs/diagrams/task-gantt.md) (auto-genererad)

**Planerade artefakter (skapas i respektive task):** data-model-ER-diagram
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
