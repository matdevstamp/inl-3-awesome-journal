# Task: TypeScript Strict Configuration

## Metadata
- **Priority:** P0 - Critical
- **Deadline:** 2026-09-08
- **Status:** TODO
- **Assignee:** matdevstamp
- **Tags:** typescript, type-safety, required, gate:2-scaffold
- **Dependencies:** 05-nextjs-tailwind-shadcn.md, 06-backend-project-setup.md
- **GitHub Issue:** #8 (https://github.com/matdevstamp/inl-3-awesome-journal/issues/8)
- **Estimated Effort:** 2h

## Requirements

- Strict TypeScript configuration
- Type safety across the codebase
- Proper path aliases
- Shared request/response types imported by UI and route handlers (no OpenAPI-generated client — kickoff decision)
- No `any` types (or minimal usage)

## User Stories

- As a developer, I want strict types and shared API types so that incompatible frontend and backend assumptions fail early.
- As a reviewer, I want unsafe implicit types rejected so that privacy-sensitive code is easier to inspect.

## Design

### TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    
    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    
    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": false,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    
    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Next.js Node Config (next-env.d.ts)

Next.js provides `next-env.d.ts` for the Node/server side; Next 15+ also supports `tsconfig.server.json` when a custom server is used (needed only for the Socket.IO custom server decision). No `vite.config.ts`/`vitest.config.ts` exist in this project.

### Shared Types & Typed API Helpers

Because UI and route handlers live in one app, types are shared directly instead of generated from an OpenAPI spec:

```typescript
// src/lib/types/api.ts (single source for API shapes)
export type Role = "doctor" | "nurse" | "ambulance" | "patient" | "unauthorized";

export interface User {
  id: number;
  username: string;
  role: Role;
}

export interface Patient {
  id: number;
  personalNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

export interface ApiError {
  error: string;
  message: string;
}
```

Route handlers import these types for responses; client components import the same types for data. A small typed `fetch` wrapper in `src/lib/api/client.ts` can centralize base URL, credentials, and error handling — it is a convenience, not a security boundary.

### Utility Types

```typescript
// src/lib/types/utils.ts
// Make all properties optional (for updates)
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make specific properties required
export type RequireFields<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// Zod-inferred request/response payloads (if Zod is used)
import { z } from "zod";
export const loginSchema = z.object({ username: z.string(), password: z.string() });
export type LoginInput = z.infer<typeof loginSchema>;
```

### Strict Type Guards

```typescript
// src/lib/types/typeGuards.ts
import type { Role, User } from "./api";

// Type guard for user role
export function isDoctor(user: User): user is User & { role: "doctor" } {
  return user.role === "doctor";
}

export function isNurse(user: User): user is User & { role: "nurse" } {
  return user.role === "nurse";
}

export function isPatient(user: User): user is User & { role: "patient" } {
  return user.role === "patient";
}

export function isHealthcareStaff(user: User): boolean {
  return ["doctor", "nurse", "ambulance"].includes(user.role);
}

// Type guard for API error responses
export function isApiError(response: unknown): response is { error: string; message: string } {
  return (
    typeof response === "object" &&
    response !== null &&
    "error" in response &&
    "message" in response
  );
}
```

### Strict React Components

```typescript
// Example of strictly typed component
import type { Patient } from "@/lib/types/api";

interface PatientCardProps {
  patient: Patient;
  onSelect: (patientId: number) => void;
  showAccessLogs?: boolean;
}

export function PatientCard({ patient, onSelect, showAccessLogs = false }: PatientCardProps) {
  // patient.id is typed as number
  // onSelect expects number argument
  // showAccessLogs is boolean
  return (
    <Card onClick={() => onSelect(patient.id)}>
      <CardHeader>
        <CardTitle>{patient.firstName} {patient.lastName}</CardTitle>
        <CardDescription>DOB: {patient.dateOfBirth}</CardDescription>
      </CardHeader>
    </Card>
  );
}
```

### Strict Event Handlers

```typescript
// Strict event handler types
import { type FormEvent, type ChangeEvent } from "react";

interface LoginFormProps {
  onSubmit: (credentials: { username: string; password: string }) => void;
  isLoading: boolean;
}

export function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    
    // Type-safe submission
    onSubmit({ username, password });
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    // e.target.value is typed as string
    console.log(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input name="username" onChange={handleChange} />
      <Input name="password" type="password" onChange={handleChange} />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Loading..." : "Login"}
      </Button>
    </form>
  );
}
```

## Tasks

- [ ] Configure tsconfig.json with strict settings
- [ ] Configure tsconfig.json with strict settings (Next.js defaults + strict)
- [ ] Setup path aliases (@/* -> ./src/*)
- [ ] Create shared API types module (src/lib/types/api.ts)
- [ ] Create utility types file
- [ ] Create type guard utilities
- [ ] Update the typed fetch client for safety
- [ ] Fix any TypeScript errors in existing code
- [ ] Add no-explicit-any rule to ESLint
- [ ] Document TypeScript conventions
- [ ] Train team on strict TypeScript

## Done Criteria

- [ ] TypeScript compiles with no errors
- [ ] Strict mode is enabled
- [ ] Path aliases work correctly
- [ ] Shared API types are used by route handlers and client components
- [ ] No `any` types (or documented exceptions)
- [ ] Type guards are used for runtime checks
- [ ] React components are strictly typed
- [ ] Event handlers are type-safe

## Notes

- Use `strict: true` to enable all strict checks
- `noUncheckedIndexedAccess` adds undefined to indexed access types
- Use type narrowing instead of type assertions
- Prefer interfaces over types for object shapes
- Use `satisfies` operator for type checking without widening
- No `generated.ts`/`openapi-fetch` — types are shared directly in the single Next.js app (kickoff decision)

## Questions to Resolve

- [ ] Should we enable `exactOptionalPropertyTypes`?
- [ ] How to handle third-party library types?
- [ ] Should we use `type` or `interface`?
