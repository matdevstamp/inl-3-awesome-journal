# Gruppkontrakt — Inl 3 Grupparbete (HealthAccess)

> **Status:** Utkast v0.1 — fyll i och signera på kickoffet fredag 4 september.
> Mall: [Gruppkontrakt mall](https://gist.github.com/postmodernistx/6afcbe224bce912a6da1a86b8b94adbc) · Scope: [`docs/Raw_Requirements.md`](docs/Raw_Requirements.md)

## Team

| Namn | GitHub | Roll |
|---|---|---|
| Matias Marti | `matdevstamp` | Lead |
| Kassim Segerberg | `Kassim10` | TBD |
| Ramadan | `rcilomba` | TBD |
| Najma Hasan | `umoraghad0-del` | TBD |

## 1. Projekt & ambitionsnivå

Vi bygger HealthAccess: ett system där medicinska journaler ligger i en SQL-databas och varje journal-åtkomst loggas till en blockkedja, distribuerad över två servrar (P2P). Vi jobbar enligt `docs/PROJECT_PLAN.md` med PR-only arbetsflöde och minst **2 dokumenterade möten per vecka** i repot (kurskrav).

- **Ambitionsnivå:** TBD (förslag: G med marginal — fungerande demo av hela flödet + snygg dokumentation)
- **Krav på oss själva:** TBD

## 2. Roller & ansvarsområden

Rollerna följer exempelfördelningen i `docs/Raw_Requirements.md`. Vi fyller i riktiga namn bredvid Person 1–4 här när vi kommit överens på kickoffet.

| Person | Ansvarsområde | Streams |
|---|---|---|
| Person 1 — Crypto & liggare | `Block`/`Blockchain`-klasser, public/private key-signering, Merkle tree, verifiering | D (chain core) |
| Person 2 — P2P-nätverk | Websocket-synk mellan servrar, distribuera audit blocks, longest chain rule, Socket.IO | D (P2P/realtime) |
| Person 3 — Express API & middleware | Routes, `auditLogger`-middleware, backend, databas & routing | A/B/C (backend) |
| Person 4 — Front end | Inloggning, journal-sök/-vy, live access-log-vy, verifikationsbadge | A/B/C (frontend) |

**Namn → Person:** Person 1: ____ · Person 2: ____ · Person 3: ____ · Person 4: ____

- **Scrum master:** TBD (vi kan rotera)
- **Lead:** Matias Marti (`matdevstamp`)
- **Backup/review:** Person 1 ↔ Person 2, Person 3 ↔ Person 4

## 3. Tidigare grupparbeteserfarenheter

> Fyll i på kickoffet. Top 3 sämsta erfarenheter + negativa förväntningar, per person.

- Kassim: ____
- Ramadan: ____
- Najma: ____
- Matias: ____

## 4. Mötestider & format

Planera in (fyll i tider på kickoffet):

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

- Ingenting committas direkt till `main` — allt går via **PR** med minst **1 review**.
- Branch-namn: `feature/<task-id>-<topic>` eller `chore/<task-id>-<topic>`.
- Uppgifter bryts ner till ~en halv dags arbete och tas från draft-tasks/issues; tar man på sig en uppgift utanför standupen säger man till på nästa.
- Kodkonflikter löser vi tillsammans med den som äger filerna (shared files ändras bara via reviewad integrationstask).
- **Definition of done:** PR merged + CI grön + reviewer godkänd + mötesanteckning/requirements checkpoint uppdaterad.

## 8. Kodstandard

- **Commits:** ____ (förslag: Conventional Commits)
- **Lint/format:** ESLint + Prettier (se draft tasks 07–08)
- **Språk i kod (identifierare, kommentarer):** ____
- **Branch protection:** ____ (förslag: enforce PR reviews på `main`)

## 9. Feedback & återkoppling

- Code reviews görs på PR:er, tidsfrist: ____
- Feedback på design/UI: ____
- Tidsfrist för återkoppling på det någon gjort: ____

## 10. Personlighetstyp, stress & roller

> Fyll i på kickoffet — hur reagerar du vid stress? Vilken roll tar du oftast (ledare, planerare, expert, slutförare, granskare, …)?

- Kassim: ____
- Ramadan: ____
- Najma: ____
- Matias: ____

## 11. Övriga förväntningar & konsekvenser

- Hur aktiv ska man vara? ____
- Konsekvenser om någon inte dyker upp/gör sitt: ____ kontaktförsök, svarstid: ____, därefter kontakt med läraren.
- Vad är du bra på / sämre på? Vad vill du träna extra på (HTML/CSS/git/projektledning/…)? ____

## 12. Övrigt

- (Egna rubriker/överenskommelser vi vill lägga till — t.ex. arbetstider, helgpolicy, AI-användning.)

## 13. Underskrifter

Vi har läst och godkänner gruppkontraktet:

| Namn | GitHub | Datum | Signatur |
|---|---|---|---|
| Matias Marti | `matdevstamp` | | |
| Kassim Segerberg | `Kassim10` | | |
| Ramadan | `rcilomba` | | |
| Najma Hasan | `umoraghad0-del` | | |
