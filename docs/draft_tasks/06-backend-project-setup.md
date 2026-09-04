# Task: Backend Project Setup (Next.js Route Handlers & Services)

## Metadata
- **Priority:** P0 - Critical
- **Deadline:** 2026-09-08
- **Status:** TODO
- **Assignee:** matdevstamp (pairs: Kassim10)
- **Tags:** backend, nodejs, api, required, gate:2-scaffold
- **Dependencies:** 04-database-design.md, 05-nextjs-tailwind-shadcn.md
- **Estimated Effort:** 4h

## Requirements

- Server-side skeleton inside the Next.js app: route handlers under `src/app/api`, shared services in `src/lib`
- RESTful JSON endpoints called by the UI in the same app
- JWT authentication (httpOnly cookie) shared via Next.js middleware + route handlers
- Database integration (PostgreSQL + Prisma)
- Socket.IO attached for real-time P2P updates between the two servers

The examples below are optional starter snippets, not mandatory implementation choices. Equivalent Next.js route handler, validation, and documentation tooling is acceptable. Express is **not** used (kickoff decision: fullstack Next.js).

## User Stories

- As a backend developer, I want a runnable typed server skeleton so that feature work can be added in separate modules.
- As a teammate, I want documented environment variables and start commands so that I can reproduce the local setup.

## Design

### Project Structure

```
src/
├── app/api/              # route handlers (HTTP endpoints)
│   ├── auth/             #   login/logout/me
│   ├── patients/         #   search + journal
│   ├── records/          #   medical records CRUD
│   ├── notes/            #   notes + visibility
│   └── access-log/       #   blockchain access log
├── lib/
│   ├── prisma.ts         # shared Prisma client
│   ├── auth.ts           # JWT sign/verify, cookie helpers
│   ├── authMiddleware.ts # guard used by route handlers
│   ├── audit.ts          # auditLogger (sign event, mine block)
│   ├── blockchain.ts     # Block/Blockchain core
│   ├── p2p.ts            # Socket.IO sync between servers
│   └── env.ts            # typed environment access
├── middleware.ts         # Next.js middleware (route protection)
├── prisma/schema.prisma  # database schema
├── package.json
├── tsconfig.json
└── .env.example
```

### Environment Variables

```bash
# .env.example
# Server identity
SERVER_ID=hospital-s        # or ambulance-a
PORT=3001                   # server 1; server 2 uses 3002

# Database (shared by both servers)
DATABASE_URL="postgresql://user:password@localhost:5432/healthaccess"

# JWT
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="24h"

# Peer (the other server)
PEER_URL="http://localhost:3002"   # on server 2 this is localhost:3001

# Socket.IO
SOCKET_CORS_ORIGIN="http://localhost:3001,http://localhost:3002"
```

### Shared Types Instead of OpenAPI Generation

The UI and the API live in one TypeScript codebase, so **shared types replace the OpenAPI/generated-client pattern** (kickoff decision — no `openapi.json`/`generated.ts`). Define request/response types once, e.g. in `src/lib/types/api.ts`, and import them from both route handlers and client components. Zod schemas can double as validation and type inference (`z.infer`).

Route handlers stay the single security boundary: they authenticate, authorize, and filter every request. A React Query cache or shared type is never a security boundary.

### Route Handler + Health Example

Each HTTP endpoint is a route handler under `src/app/api/.../route.ts`. There is no Express app or `listen()` call — Next.js serves the app; each instance runs on its own port (`npm run dev -- -p 3001` and `-p 3002`).

```typescript
// src/app/api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    server: process.env.SERVER_ID ?? "unknown",
    timestamp: new Date().toISOString(),
  });
}
```

```typescript
// src/app/api/auth/login/route.ts (shape)
import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();
  const { token, user } = await login(username, password);
  if (!token) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const response = NextResponse.json({ user });
  response.cookies.set("token", token, { httpOnly: true, sameSite: "lax" });
  return response;
}
```

Error responses, rate limiting, and request validation are small shared helpers in `src/lib/` used inside route handlers (no Express middleware stack).

### Database Configuration

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export { prisma };
```

### Authentication Helper

JWT is read from the httpOnly cookie. A small helper used inside each protected route handler replaces Express middleware:

```typescript
// src/lib/auth.ts (shape)
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export interface SessionUser {
  id: number;
  username: string;
  role: "doctor" | "nurse" | "ambulance" | "patient" | "unauthorized";
}

export function getSession(): SessionUser | null {
  const token = cookies().get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as SessionUser;
  } catch {
    return null;
  }
}

export function requireRole(...roles: SessionUser["role"][]) {
  const user = getSession();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!roles.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}
```

Next.js `middleware.ts` may additionally short-circuit unauthenticated page requests; server-side authorization still happens per route handler (never trust the client).

## Tasks

- [ ] Confirm the Next.js scaffold from task 05 runs on ports 3001 and 3002
- [ ] Add shared env helper (`src/lib/env.ts`) with `.env.example`
- [ ] Create shared Prisma client (`src/lib/prisma.ts`)
- [ ] Add shared API types module (`src/lib/types/api.ts`)
- [ ] Implement JWT helpers + httpOnly cookie session (`src/lib/auth.ts`)
- [ ] Add a per-route `getSession`/`requireRole` guard used by route handlers
- [ ] Create stub route handlers: auth, patients, records, notes, access-log
- [ ] Add `/api/health` route handler returning server id + timestamp
- [ ] Wire Socket.IO for the two servers (see tasks 16/18)
- [ ] Add rate limiting and error handling helpers
- [ ] Add npm scripts for dev (both ports), lint, test, db:migrate, db:seed
- [ ] Verify both server instances start and reach `/api/health`

## Done Criteria

- [ ] Both servers start without errors on ports 3001/3002
- [ ] Database connection works through Prisma
- [ ] JWT cookie login round-trip works
- [ ] Role guard rejects missing/forbidden sessions
- [ ] Route handler stubs are registered under `src/app/api`
- [ ] `/api/health` responds with the server id
- [ ] Environment variables are loaded and validated
- [ ] TypeScript compiles successfully

## Notes

- No Express — route handlers + shared libs inside the Next.js app (kickoff decision)
- Use Prisma for database access (type-safe ORM)
- Use Zod for request validation
- Log all authentication attempts

## Questions to Resolve

- [x] PostgreSQL vs SQLite for development? → PostgreSQL (task 02 decision)
- [x] Which ORM to use? → Prisma
- [ ] Should we use a logger library (winston, pino)?
