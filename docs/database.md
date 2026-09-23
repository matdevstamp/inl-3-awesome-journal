# Database Documentation

## Overview

HealthAccess använder PostgreSQL som SQL-databas och Prisma som ORM.

Datamodellen definieras i:

`prisma/schema.prisma`

Prisma-schemat är projektets **single source of truth** för datamodellen.

En Mermaid ER-modell genereras automatiskt från Prisma-schemat och finns här:

[Data model (ER)](diagrams/data-model.md)

Diagrammet ska inte redigeras manuellt. Det genereras på nytt när `npx prisma generate` körs.

---

## Privacy boundary

Medicinska uppgifter lagras endast i SQL-databasen.

Blockkedjan innehåller inte patientjournaler eller annan medicinsk information. Endast information kopplad till access-loggar representeras på blockkedjan.

Det innebär:

- Patientdata lagras i PostgreSQL.
- Journalposter lagras i PostgreSQL.
- Anteckningar lagras i PostgreSQL.
- Access-loggar lagras i SQL och synkroniseras till blockkedjan.
- Medicinsk information skickas aldrig till blockkedjan.

---

## Database tables

### `organizations`

Representerar organisationer som användare tillhör, exempelvis sjukhus, kliniker eller ambulansorganisationer.

| Column | Type | Description |
|---|---|---|
| `id` | Integer | Primärnyckel |
| `name` | String | Organisationens namn |
| `type` | String? | Organisationstyp |

En organisation kan ha flera användare.

---

### `users`

Innehåller systemets användare och deras roller.

| Column | Type | Description |
|---|---|---|
| `id` | Integer | Primärnyckel |
| `username` | String | Unikt användarnamn |
| `password_hash` | String | Hashat lösenord |
| `role` | Role | Användarens roll |
| `organization_id` | Integer? | Koppling till organisation |
| `created_at` | DateTime | Skapad tidpunkt |
| `updated_at` | DateTime | Senast uppdaterad |

Rollerna är:

- `doctor`
- `nurse`
- `ambulance`
- `patient`
- `unauthorized`

---

### `patients`

Innehåller patienternas grundläggande information.

| Column | Type | Description |
|---|---|---|
| `id` | Integer | Primärnyckel |
| `personal_number` | String | Svenskt personnummer |
| `first_name` | String | Förnamn |
| `last_name` | String | Efternamn |
| `date_of_birth` | Date | Födelsedatum |
| `created_at` | DateTime | Skapad tidpunkt |

`personal_number` är unikt.

Patienter kan ha flera medicinska journalposter och flera access-loggar.

---

### `medical_records`

Innehåller medicinska journalposter.

| Column | Type | Description |
|---|---|---|
| `id` | Integer | Primärnyckel |
| `record_type` | String | Typ av journalpost |
| `content` | String | Medicinskt innehåll |
| `patient_id` | Integer | Patient som journalposten tillhör |
| `author_id` | Integer | Användaren som skapade journalposten |
| `created_at` | DateTime | Skapad tidpunkt |
| `updated_at` | DateTime | Senast uppdaterad |

Medicinska journalposter lagras **endast i SQL-databasen**.

---

### `notes`

Innehåller anteckningar kopplade till medicinska journalposter.

| Column | Type | Description |
|---|---|---|
| `id` | Integer | Primärnyckel |
| `content` | String | Anteckningens innehåll |
| `visibility` | NoteVisibility | Anteckningens synlighetsnivå |
| `record_id` | Integer | Journalpost som anteckningen tillhör |
| `author_id` | Integer | Användaren som skapade anteckningen |
| `created_at` | DateTime | Skapad tidpunkt |
| `updated_at` | DateTime | Senast uppdaterad |

Synlighetsnivåerna är:

- `private`
- `healthcare`
- `all`

---

### `access_logs`

Innehåller audit/access-loggar för användning av patientdata.

| Column | Type | Description |
|---|---|---|
| `id` | Integer | Primärnyckel |
| `action` | String | Exempelvis view, edit eller create |
| `server_id` | String | Servern som hanterade händelsen |
| `user_id` | Integer | Användaren som utförde handlingen |
| `patient_id` | Integer | Berörd patient |
| `record_id` | Integer? | Berörd journalpost |
| `blockchain_synced` | Boolean | Om loggen har synkroniserats till blockkedjan |
| `created_at` | DateTime | Tidpunkt för händelsen |

Access-loggar används för att kunna spåra åtkomst till patientdata.

Endast access-loggens relevanta information representeras på blockkedjan. Patientens medicinska innehåll lagras inte på blockkedjan.

---

## Enums

### `Role`

Tillåtna roller:

- `doctor`
- `nurse`
- `ambulance`
- `patient`
- `unauthorized`

### `NoteVisibility`

Tillåtna synlighetsnivåer för anteckningar:

- `private`
- `healthcare`
- `all`

---

## Relationships

Databasen använder foreign keys för relationerna mellan tabellerna.

### Organization → User

En organisation kan ha flera användare.

`Organization 1 ──── * User`

### Patient → MedicalRecord

En patient kan ha flera journalposter.

`Patient 1 ──── * MedicalRecord`

### User → MedicalRecord

En användare kan skapa flera journalposter.

`User 1 ──── * MedicalRecord`

### MedicalRecord → Note

En journalpost kan ha flera anteckningar.

`MedicalRecord 1 ──── * Note`

### User → Note

En användare kan skapa flera anteckningar.

`User 1 ──── * Note`

### User → AccessLog

En användare kan ha flera access-loggar.

`User 1 ──── * AccessLog`

### Patient → AccessLog

En patient kan ha flera access-loggar.

`Patient 1 ──── * AccessLog`

### MedicalRecord → AccessLog

En journalpost kan vara kopplad till flera access-loggar.

`MedicalRecord 1 ──── * AccessLog`

---

## Index och constraints

Databasen använder constraints och index för dataintegritet och effektiv sökning.

### Unique

Följande fält är unika:

- `users.username`
- `patients.personal_number`

### Index

Följande index används:

- `patients(last_name, first_name)`
- `medical_records(patient_id)`
- `notes(record_id)`
- `access_logs(patient_id)`

Foreign keys används mellan relaterade tabeller för att säkerställa referentiell integritet.

---

## Migrations

Den initiala databasmigrationen finns här:

`prisma/migrations/20260904_init/migration.sql`

Migrationen innehåller bland annat:

- PostgreSQL-schema
- enums
- tabeller
- indexes
- foreign keys

Migrationen fungerar samtidigt som projektets reproducerbara SQL/Create-script för den initiala databasen.

För en ny miljö ska sparade Prisma-migrationer användas istället för att manuellt skapa tabeller.

---

## Database setup

Efter att projektets dependencies och miljövariabler har konfigurerats kan databasen startas med:

```bash
npm run db:up
Applicera sparade migrationer:

`npm run db:deploy`

eller använd utvecklingsmigrationen:

`npm run db:migrate`

Seed-data kan skapas med:

`npm run db:seed`

Prisma-klienten och ER-diagrammet genereras med:

`npx prisma generate`

---

## Seed data

Projektet använder fiktiv testdata.

Seed-scriptet finns i:

`prisma/seed.js`

Seed-data används bland annat för att testa:

- autentisering
- olika användarroller
- patientsökning
- journalvyer
- medicinska anteckningar
- behörighetskontroller
- access-loggar
- blockchain-flödet

Ingen riktig patientdata ska användas i projektet.

---

## Source of truth

Datamodellen ska ändras genom:

`prisma/schema.prisma`

Efter ändringar ska Prisma-migrationer och det genererade ER-diagrammet uppdateras.

Den genererade modellen finns här:

[Data model (ER)](diagrams/data-model.md)

SQL-migrationerna finns här:

[Prisma migrations](../prisma/migrations/)
