# Sequence: Permitted Read → Access Log → P2P

En behörig användare läser en journal på Server 1. Den medicinska datan hämtas
från PostgreSQL (stannar i SQL), en access-log läggs på blockkedjan och
distribueras till Server 2, där en annan behörig användare ser händelsen live
via Socket.IO — och även den läsningen loggas.

```mermaid
sequenceDiagram
    autonumber
    participant U1 as Läkare (Server 1)
    participant S1 as Next.js Server 1
    participant DB as PostgreSQL
    participant CHAIN as Access-log kedja
    participant S2 as Next.js Server 2
    participant U2 as Ambulanspersonal (Server 2)

    U1->>S1: POST /api/login
    S1-->>U1: JWT i httpOnly cookie

    U1->>S1: GET /api/patients?name=… (med cookie)
    S1->>S1: verifiera roll + behörighet
    S1->>DB: hämta journal (SQL)
    DB-->>S1: journaldata — stannar i SQL
    S1-->>U1: journal + tillåtna anteckningar

    Note over S1: auditLogger skapar access-log-post
    S1->>CHAIN: append access-log (hash-kedja)
    CHAIN-->>S1: bekräftat block

    S1-->>S2: Socket.IO: access-log + anteckning broadcast
    S2->>S2: visibility-kontroll mot roll
    S2-->>U2: ny anteckning/access-log visas live

    U2->>S2: öppnar anteckningen
    S2->>CHAIN: append egen access-log
    S2-->>U1: tillbaka till Server 1 (P2P-synk)
```
