# Task: Backend Project Setup

## Metadata
- **Priority:** P0 - Critical
- **Deadline:** 2026-09-05
- **Status:** TODO
- **Assignee:** TBD
- **Tags:** backend, nodejs, express, required
- **Dependencies:** 04-database-design.md, 05-vite-tailwind-shadcn.md
- **Estimated Effort:** 4h

## Requirements

- Node.js/Express backend with TypeScript
- RESTful API following OpenAPI spec
- JWT authentication
- Database integration (PostgreSQL)
- CORS configuration for frontend
- Socket.io for real-time updates

## User Stories

- As a backend developer, I want a runnable typed server skeleton so that feature work can be added in separate modules.
- As a teammate, I want documented environment variables and start commands so that I can reproduce the local setup.

## Design

### Project Structure

```
src/backend/
├── src/
│   ├── config/
│   │   ├── database.ts      # Database connection
│   │   ├── environment.ts   # Environment variables
│   │   └── socket.ts        # Socket.io configuration
│   ├── middleware/
│   │   ├── auth.ts          # JWT authentication
│   │   ├── errorHandler.ts  # Global error handler
│   │   ├── rateLimiter.ts   # Rate limiting
│   │   └── validate.ts      # Request validation
│   ├── routes/
│   │   ├── auth.ts          # Authentication routes
│   │   ├── patients.ts      # Patient routes
│   │   ├── records.ts       # Medical records routes
│   │   ├── notes.ts         # Notes routes
│   │   └── blockchain.ts    # Blockchain routes
│   ├── services/
│   │   ├── authService.ts
│   │   ├── patientService.ts
│   │   ├── recordService.ts
│   │   ├── noteService.ts
│   │   └── blockchainService.ts
│   ├── models/
│   │   ├── user.ts
│   │   ├── patient.ts
│   │   ├── medicalRecord.ts
│   │   ├── note.ts
│   │   └── accessLog.ts
│   ├── utils/
│   │   ├── errors.ts        # Custom error classes
│   │   └── logger.ts        # Logging utility
│   └── index.ts             # Entry point
├── prisma/
│   └── schema.prisma        # Database schema
├── package.json
├── tsconfig.json
└── .env.example
```

### Package.json

```json
{
  "name": "healthaccess-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint . --ignore-pattern 'node_modules'",
    "lint:fix": "eslint . --fix --ignore-pattern 'node_modules'",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^6.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "socket.io": "^4.7.2",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.10.0",
    "eslint": "^9.17.0",
    "@eslint/js": "^9.17.0",
    "typescript-eslint": "^8.18.2",
    "globals": "^15.14.0",
    "prisma": "^6.0.0",
    "tsx": "^4.7.0",
    "typescript": "~5.6.2",
    "vitest": "^2.1.8"
  }
}
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Environment Variables

```bash
# .env.example
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/healthaccess"

# JWT
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="24h"

# CORS
CORS_ORIGIN="http://localhost:5173"

# Socket.io
SOCKET_CORS_ORIGIN="http://localhost:5173"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Main Entry Point

```typescript
// src/index.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

import { env } from "./config/environment.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { authRoutes } from "./routes/auth.js";
import { patientRoutes } from "./routes/patients.js";
import { recordRoutes } from "./routes/records.js";
import { noteRoutes } from "./routes/notes.js";
import { blockchainRoutes } from "./routes/blockchain.js";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const httpServer = createServer(app);

// Create Socket.io server
export const io = new Server(httpServer, {
  cors: {
    origin: env.SOCKET_CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(rateLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/blockchain", blockchainRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Start server
httpServer.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on("join_patient_room", (patientId: number) => {
    socket.join(`patient_${patientId}`);
    console.log(`${socket.id} joined patient_${patientId}`);
  });
  
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

export default app;
```

### Database Configuration

```typescript
// src/config/database.ts
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

### Authentication Middleware

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/environment.js";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  
  const token = authHeader.split(" ")[1];
  
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: number;
      username: string;
      role: string;
    };
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    next();
  };
}
```

## Tasks

- [ ] Initialize Node.js project with TypeScript
- [ ] Install dependencies (Express, Prisma, JWT, etc.)
- [ ] Configure TypeScript
- [ ] Setup environment variables
- [ ] Create database schema with Prisma
- [ ] Setup database connection
- [ ] Create authentication middleware
- [ ] Create role-based authorization middleware
- [ ] Setup CORS configuration
- [ ] Create rate limiter
- [ ] Create error handler middleware
- [ ] Setup Socket.io for real-time updates
- [ ] Create route stubs
- [ ] Add npm scripts for dev, build, start
- [ ] Test server startup

## Done Criteria

- [ ] Server starts without errors
- [ ] Database connection works
- [ ] Authentication middleware works
- [ ] Authorization middleware works
- [ ] CORS is configured
- [ ] Rate limiting is active
- [ ] Socket.io connection works
- [ ] All routes are registered
- [ ] Environment variables are loaded
- [ ] TypeScript compiles successfully

## Notes

- Use `tsx` for development (fast TypeScript execution)
- Use Prisma for database access (type-safe ORM)
- Use Zod for request validation
- Use helmet for security headers
- Log all authentication attempts

## Questions to Resolve

- [ ] PostgreSQL vs SQLite for development?
- [ ] Which ORM to use? (Prisma recommended)
- [ ] Should we use a logger library (winston, pino)?
