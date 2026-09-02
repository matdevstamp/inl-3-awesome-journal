# Task: TypeScript Strict Configuration

## Metadata
- **Priority:** P0 - Critical
- **Deadline:** 2026-09-04
- **Status:** TODO
- **Assignee:** TBD
- **Tags:** typescript, type-safety, required
- **Dependencies:** 05-vite-tailwind-shadcn.md, 06-backend-project-setup.md
- **Estimated Effort:** 2h

## Requirements

- Strict TypeScript configuration
- Type safety across the codebase
- Proper path aliases
- Generated types from OpenAPI spec
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

### TypeScript Node Config (tsconfig.node.json)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

### Type-Safe API Client

```typescript
// src/utils/apiClient.ts
import createClient from "openapi-fetch";
import type { paths } from "./generated";

// Type-safe API client
export const api = createClient<paths>({
  baseUrl: getBaseUrl(),
  headers: () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});

// Usage example with full type safety:
const { data, error } = await api.GET("/api/patients/{patientId}", {
  params: {
    path: { patientId: 123 },
  },
});

// data is fully typed as components["schemas"]["Patient"]
// error is fully typed as components["schemas"]["Error"]
```

### Utility Types

```typescript
// src/utils/types.ts

// Extract response type from API path
export type ApiResponse<T extends keyof paths> = paths[T] extends {
  get: { responses: { 200: { content: { "application/json": { schema: infer S } } } } };
}
  ? S
  : never;

// Extract request body type
export type RequestBody<T extends keyof paths, M extends "post" | "put" | "patch" = "post"> =
  paths[T] extends { [K in M]: { requestBody: { content: { "application/json": { schema: infer S } } } } }
    ? S
    : never;

// Make all properties optional (for updates)
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Make specific properties required
export type RequireFields<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// Omit specific properties
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
```

### Strict Type Guards

```typescript
// src/utils/typeGuards.ts
import type { components } from "./generated";

type User = components["schemas"]["User"];
type UserRole = components["schemas"]["UserRole"];

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

// Type guard for API response
export function isApiError(
  response: unknown
): response is { error: string; message: string } {
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
interface PatientCardProps {
  patient: components["schemas"]["Patient"];
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
- [ ] Configure tsconfig.node.json
- [ ] Setup path aliases
- [ ] Create utility types file
- [ ] Create type guard utilities
- [ ] Update apiClient.ts for type safety
- [ ] Fix any TypeScript errors in existing code
- [ ] Add no-explicit-any rule to ESLint
- [ ] Document TypeScript conventions
- [ ] Train team on strict TypeScript

## Done Criteria

- [ ] TypeScript compiles with no errors
- [ ] Strict mode is enabled
- [ ] Path aliases work correctly
- [ ] API types are generated and used
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

## Questions to Resolve

- [ ] Should we enable `exactOptionalPropertyTypes`?
- [ ] How to handle third-party library types?
- [ ] Should we use `type` or `interface`?
