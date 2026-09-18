# Backend API

Backend-API:t är implementerat med Next.js Route Handlers under `src/app/api`.

API:t använder JSON för request- och response-data. Autentisering hanteras med JWT som lagras i en httpOnly-cookie.

## Autentisering

### POST /api/auth/login

Loggar in en användare med användarnamn och lösenord.

Systemet stödjer följande roller:

- doctor
- nurse
- ambulance
- patient
- unauthorized

Vid lyckad inloggning skapas en JWT-token som lagras i en httpOnly-cookie. Token innehåller information om den autentiserade användaren, bland annat roll och organisation.

Lösenord verifieras säkert med bcrypt.

Felaktigt användarnamn eller lösenord returnerar samma felmeddelande för att inte avslöja om en viss användare finns i systemet.

### POST /api/auth/logout

Loggar ut den aktuella användaren genom att ta bort autentiseringscookien.

### GET /api/auth/me

Returnerar information om den användare som för närvarande är autentiserad.

Endpointen kräver en giltig autentiserad session.

## Patienter

### GET /api/patients?q={query}&filter={filter}&page={page}

Patient search reads from SQL and requires a valid JWT cookie. Mock role headers are not accepted.
`filter` supports `name` (default), `dob`, and `personalNumber`; repeated filters use OR matching.
Names match case-insensitively, including full names. Date prefixes use `YYYY`, `YYYY-MM`, or
`YYYY-MM-DD`. Personal numbers can include a hyphen. The legacy `name` query parameter is supported.
Pages contain three results in stable name/ID order; pages beyond the last page are clamped.
Invalid filters or page numbers return 400. Missing sessions return 401; forbidden roles return 403.
The response uses `PatientSearchResponse` in `src/lib/types/api.ts`. Note counts exclude other
authors' private notes. `lastVisit` is the latest record creation date, or `-` when no records exist.

Söker efter patienter baserat på namn.

Tillåtna roller:

- doctor
- nurse
- ambulance

Följande roller har inte tillgång till patientsökningen:

- patient
- unauthorized

Endpointen skyddas server-side med rollbaserad åtkomstkontroll.

## Health

### GET /api/health

Returnerar information om API:ts och serverns status.

Endpointen används bland annat för att kontrollera att servern är igång.

## Journaler

Funktionalitet för medicinska journaler tillhör Task 14.

Route-strukturen finns förberedd i API:t, men full CRUD-funktionalitet implementeras separat i Task 14.

## Anteckningar

Funktionalitet för anteckningar och synlighetsnivåer tillhör Task 14.

Route-strukturen finns förberedd, medan full CRUD och kontroll av synlighetsnivåer implementeras separat i Task 14.

## Access logs

Blockchain-baserad access-loggning tillhör Task 15.

Route-strukturen finns förberedd, men den fullständiga implementationen görs i Task 15.

## Roller och behörighet

Systemet har fem roller:

| Roll         | Beskrivning               |
| ------------ | ------------------------- |
| doctor       | Läkare                    |
| nurse        | Sjuksköterska             |
| ambulance    | Ambulanspersonal          |
| patient      | Patient                   |
| unauthorized | Användare utan behörighet |

Skyddade API-routes kontrollerar autentisering och behörighet server-side.

Funktionen `requireRole()` används för att kontrollera att en autentiserad användare har rätt roll för en skyddad endpoint.

## JWT och sessionshantering

JWT används för autentisering.

Token lagras i en httpOnly-cookie och är därför inte direkt tillgänglig från JavaScript i webbläsaren.

Cookien använder även:

- `httpOnly`
- `sameSite: lax`
- `secure` i production
- `path: /`

JWT verifieras server-side innan skyddade resurser får användas.

## Standardsvar från API:t

Lyckade requests använder följande struktur:

```json
{
  "ok": true,
  "data": {}
}
```

Fel använder följande struktur:

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Felmeddelande"
  }
}
```

Detta gör att API-routes använder ett konsekvent format för både lyckade requests och fel.

## Validering

Request-data valideras med Zod innan den behandlas.

Exempelvis valideras inloggningsuppgifter innan användaren söks i databasen.

Ogiltig request-data returnerar ett lämpligt 4xx-svar.

## Rate limiting

Inloggningsendpointen använder rate limiting för att minska risken för missbruk och upprepade inloggningsförsök.

När gränsen överskrids returneras HTTP-status:

`429 Too Many Requests`

## CORS

API:t tillåter de två lokala origins som används av projektets demo-servrar:

- `http://localhost:3001`
- `http://localhost:3002`

Okända origins tillåts inte.

Credentials stöds eftersom autentiseringen använder en httpOnly-cookie.

## Skydd av sidor

Next.js `proxy.ts` används för att stoppa oautentiserade requests till skyddade sidor innan sidan laddas.

API-routes gör fortfarande sina egna autentiserings- och behörighetskontroller server-side.

Proxy-lagret ersätter alltså inte säkerhetskontrollerna i API:t.

## Shared API types

Gemensamma TypeScript-typer för API-kontrakt finns i:

`src/lib/types/api.ts`

Där definieras bland annat:

- användarroller
- synlighetsnivåer för anteckningar
- sessionsanvändare
- standardsvar från API:t
- login request
- login response
- health response

Projektet använder gemensamma TypeScript-typer istället för en OpenAPI-genererad klient eftersom frontend och backend finns i samma Next.js-applikation.

## Tester

Backendens autentisering och säkerhetsfunktioner testas med Playwright.

Tester finns bland annat för:

- lyckad inloggning
- felaktiga inloggningsuppgifter
- alla fem användarroller
- validering av login-data
- logout
- `/api/auth/me`
- patientsökning och rollkontroll
- rate limiting
- CORS
- skydd av autentiserade sidor

Testdata är fiktiv och skapas genom projektets seed-script.
