# Gruppkontrakt — Inl 3 Grupparbete (HealthAccess)

> **Status:** v0.4 — signerat av Matias fre 4 sep (omfattar kickoff-besluten: roller, branch-regel, PR-granskning, schema); övriga signerar senast lör 5 sep. Najma (`umoraghad0-del`) var inte på kickoffet och har deklarerat sitt fokus i efterhand (5 sep): **huvudansvar för blockchain/access-logging (Stream D, task 15)** + pair-programmering på P2P (16) och Socket.IO (18). Ramadan behåller task 12 (Frontend UI).
> Mall: [Gruppkontrakt mall](https://gist.github.com/postmodernistx/6afcbe224bce912a6da1a86b8b94adbc) · Scope: [`docs/Raw_Requirements.md`](docs/Raw_Requirements.md)

## Team

| Namn | GitHub | Roll |
|---|---|---|
| Matias Marti | `matdevstamp` | Koordinator / Lead (fokus på Gate 1–2) |
| Kassim Segerberg | `Kassim10` | Backend (API-routes, DB/Prisma, middleware); stream D chain core öppen |
| Ramadan | `rcilomba` | UI / Frontend (all UI, stream D-vyn TBD) |
| Najma Hasan | `umoraghad0-del` | Blockchain/access-logging (Stream D huvudansvar, task 15); pair på P2P (16) & Socket.IO (18) |

## 1. Projekt & ambitionsnivå

Vi bygger HealthAccess: ett system där medicinska journaler ligger i en SQL-databas och varje journal-åtkomst loggas till en blockkedja, distribuerad över två servrar (P2P). Vi jobbar enligt `docs/PROJECT_PLAN.md` med PR-only arbetsflöde och minst **2 dokumenterade möten per vecka** i repot (kurskrav).

- **Ambitionsnivå:** TBD (förslag: G med marginal — fungerande demo av hela flödet + snygg dokumentation)
- **Krav på oss själva:** TBD

## 2. Roller & ansvarsområden

Vi avviker från exempelfördelningen Person 1–4 i `docs/Raw_Requirements.md` — vi delar i stället på backend/UI/koordinering (beslut på kickoff 4 sep, se `docs/meetings/2026-09-04-kickoff-agenda.md`). Stream D (chain core + P2P) tilldelades Najma 5 sep (se statusraden ovan).

| Person | Ansvarsområde | Streams |
|---|---|---|
| Kassim Segerberg (`Kassim10`) | Backend: Next.js API-routes, databas & Prisma, middleware, `auditLogger` | A/B/C (backend) |
| Ramadan (`rcilomba`) | Frontend/UI: task 12 (inloggning, dashboard-shell, access-denied), journal-sök/-vy, live access-log-vy, verifikationsbadge | A/B/C (frontend), D-vy |
| Matias Marti (`matdevstamp`) | Koordinator/Lead: möten, PR-review, unblocking, Gate 1–2 | — |
| Najma Hasan (`umoraghad0-del`) | Blockchain/access-logging (chain core, task 15); pair på P2P (16) & Socket.IO (18) | D (chain core + P2P) |

- **Scrum master:** TBD (vi kan rotera)
- **Lead:** Matias Marti (`matdevstamp`)
- **Backup/review:** backend ↔ UI-par (Kassim ↔ Ramadan); Matias PR:er granskas av den som har mest koll på området. Stream D-kod (blockchain/P2P/Socket.IO) granskas av Najma tillsammans med backend (Kassim).

## 3. Tidigare grupparbeteserfarenheter

> Fyll i på kickoffet. Top 3 sämsta erfarenheter + negativa förväntningar, per person.

- Kassim: ____
- Ramadan: ____
- Najma: ____
- Matias: Otydlig ansvarsfördelning (diffust ägande → saker faller mellan stolorna); allt skjuts till sista dagen → panik i slutet

## 4. Mötestider & format

Planera in (fyll i tider på kickoffet — låst när alla fyllt i [`docs/team-availability.md`](docs/team-availability.md)):

- **Daily standup varje vardag** — samma tid om möjligt: kl. ____
- **Backlog refining** varje vecka (~1 h): ____
- **Sprint planning** varje vecka (~1–2 h): ____
- **Retrospektiv** varje vecka (~1 h): ____
- Mötesanteckningar hamnar i `docs/meetings/` med [`docs/MEETING_TEMPLATE.md`](docs/MEETING_TEMPLATE.md), samma dag.
- Facilitator/timekeeper/note-taker roterar (alfabetisk ordning per vecka som default).
- Varje möte innehåller en requirements checkpoint mot `docs/Raw_Requirements.md`.

## 5. Möteskanaler & kommunikation

- **Kanal:** Microsoft Teams ✓
- **Kamera:** TBD (rekommendation: på)
- **Förberedda eller gemensam genomgång:** TBD
- **Svarstid på meddelanden:** TBD
- **Förhinder meddelas:** TBD (hur tidigt?)
- **Brådskande ärenden:** TBD (SMS/telefon?)

## 6. Loggbok & dokumentation

Vi för en **loggbok per person** för dagliga standups och mötesdeltagande (se [`docs/logbooks/README.md`](docs/logbooks/README.md)).

- **Default (förslag):** en CSV per person i `docs/logbooks/` — incheckad i repot.
- **Beslut på kickoff:** CSV (repo) **eller** Excel/Sheets externt. Väljer vi externt krävs en **ägare som inte är Matias**: ____
- Antecknare för veckans möten dokumenterar daily/standup i repot (rotera gärna).

## 7. Uppgiftsfördelning & arbetsflöde

- Ingenting committas direkt till `main` — allt går via **PR** med minst **1 review**. **Undantag (beslut på kickoff):** allt under `docs/` (markdown, CSV, diagram, `.mmd` m.m.) och Python-verktyget (`project_management/`) får pushas direkt till `main`; all app-kod (Next.js/TS, Prisma/DB-schema, config) kräver PR + review.
- **Ingen granskar eller slår ihop sin egen PR** — inte heller lead: Matias app-kod granskas av någon annan i teamet (den som har mest koll på området: Kassim för backend, Ramadan för UI, Najma där hon är inkopplad).
- Branch-namn: `feature/<task-id>-<topic>` eller `chore/<task-id>-<topic>`.
- Uppgifter bryts ner till ~en halv dags arbete och tas från draft-tasks/issues; tar man på sig en uppgift utanför standupen säger man till på nästa.
- Kodkonflikter löser vi tillsammans med den som äger filerna (shared files ändras bara via reviewad integrationstask).
- **Definition of done:** PR merged + CI grön + reviewer godkänd + mötesanteckning/requirements checkpoint uppdaterad.

## 8. Kodstandard

- **Commits:** ____ (förslag: Conventional Commits)
- **Lint/format:** ESLint + Prettier (se draft tasks 07–08)
- **Språk i kod (identifierare, kommentarer):** ____
- **Branch protection:** enforce PR reviews på `main` för app-kod; allt under `docs/` + `project_management/` får pushas direkt

## 9. Feedback & återkoppling

- Code reviews görs på PR:er, tidsfrist: **ingen fast tidsgräns** — granskaren svarar så snart som möjligt
- Feedback på design/UI: ____
- Tidsfrist för återkoppling på det någon gjort: ____

## 10. Personlighetstyp, stress & roller

> Fyll i på kickoffet — hur reagerar du vid stress? Vilken roll tar du oftast (ledare, planerare, expert, slutförare, granskare, …)?

- Kassim: ____
- Ramadan: ____
- Najma: ____
- Matias: Slutförare — fokuserar och kör klart under stress

## 11. Övriga förväntningar & konsekvenser

- Hur aktiv ska man vara? Meddela förhinder i förväg på Teams; aktiv på möten och i loggboken (förslag från lead, bekräftas vid signering)
- Konsekvenser om någon inte dyker upp/gör sitt: mjukare linje (förslag från lead) — först ett snack i gruppen, läraren kontaktas först vid upprepad frånvaro/uteblivet arbete.
- Vad är du bra på / sämre på? Vad vill du träna extra på (HTML/CSS/git/projektledning/…)?
  - Matias: Bra på kod; vill träna på PM/facilitering/koordinering

## 12. Övrigt

- (Egna rubriker/överenskommelser vi vill lägga till — t.ex. arbetstider, helgpolicy, AI-användning.)

## 13. Underskrifter

Vi har läst och godkänner gruppkontraktet:

| Namn | GitHub | Datum | Signatur |
|---|---|---|---|
| Matias Marti | `matdevstamp` | 2026-09-04 | ✅ (v0.3) |
| Kassim Segerberg | `Kassim10` | senast 2026-09-05 | |
| Ramadan | `rcilomba` | senast 2026-09-05 | |
| Najma Hasan | `umoraghad0-del` | senast 2026-09-05 | |
