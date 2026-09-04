# Data Flow

Flödet visar hur medicinska data alltid hämtas från PostgreSQL och aldrig
lämnar SQL-lagret, medan varje läsning samtidigt skapar en access-log som
läggs på blockkedjan och distribueras till den andra servern. Skilj på de
två spåren: **medicinsk data (SQL)** och **access-log (kedja)**.

```mermaid
flowchart LR
    subgraph Client["Webbläsare"]
        UI["React/Next.js UI<br/>(shadcn/ui)"]
    end

    subgraph S1["Next.js Server 1"]
        AUTH1["Auth-middleware<br/>(JWT httpOnly cookie,<br/>rollkontroll)"]
        API1["Route handlers"]
        AUDIT1["auditLogger"]
    end

    subgraph S2["Next.js Server 2"]
        AUTH2["Auth-middleware"]
        API2["Route handlers"]
    end

    DB[(PostgreSQL<br/>medicinska data)]
    CHAIN["Access-log kedja"]

    UI -->|request + cookie| AUTH1
    AUTH1 -->|behörig roll| API1
    API1 -->|SQL: journal/sök/anteckningar| DB
    DB -->|medicinska data — stannar i SQL| API1
    API1 -->|svarsdata till UI| UI

    API1 -->|varje journal-åtkomst| AUDIT1
    AUDIT1 -->|append access-log (hash + signatur)| CHAIN
    CHAIN -->|distribuerad kopia| S2

    AUDIT1 -. Socket.IO broadcast .-> API2
    API2 -->|visibility-kontroll via AUTH2| UI
    UI -.->|live: ny anteckning/access-log syns| API2

    style DB fill:#e8f0fe
    style CHAIN fill:#fde8e8
```
