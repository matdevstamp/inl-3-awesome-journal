# System Context

HealthAccess körs som **två fullstack Next.js-servrar** (t.ex. Sjukhus S och
Ambulans A) som delar en PostgreSQL-databas för medicinska data. Varje
journal-åtkomst loggas till en gemensam access-log-blockkedja; inga medicinska
uppgifter hamnar på kedjan. Aktörerna är vårdpersonal, patienten själv och
obehöriga användare — alla med olika behörighet.

```mermaid
flowchart TD
    %% Aktörer
    DOC["Läkare / Sjuksköterska / Ambulanspersonal"]
    PAT["Patient"]
    UNAUTH["Obehörig användare"]

    subgraph S1["Next.js Server 1 — Sjukhus S (:3001)"]
        API1["Route handlers + auth<br/>(JWT i httpOnly cookie)"]
    end

    subgraph S2["Next.js Server 2 — Ambulans A (:3002)"]
        API2["Route handlers + auth<br/>(JWT i httpOnly cookie)"]
    end

    DB[(PostgreSQL — gemensam DB:<br/>användare, patienter, journaler,<br/>anteckningar, access-log-status)]
    CHAIN["Access-log blockkedja<br/>(custom chain)"]

    DOC -->|login, sök, journal, anteckningar| API1
    DOC -->|login, live-anteckningar| API2
    PAT -->|login, egen journal + access logs| API1
    UNAUTH -->|vilken URL som helst| API1

    API1 <-->|SQL: medicinska data — aldrig på kedjan| DB
    API2 <-->|SQL: medicinska data| DB

    API1 -->|append access log| CHAIN
    API2 -->|append access log| CHAIN

    API1 <-->|"P2P: access-loggar + anteckningar (Socket.IO)"| API2
```
