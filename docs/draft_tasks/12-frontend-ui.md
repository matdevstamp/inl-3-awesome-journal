# Task: Frontend UI Development

## Metadata
- **Priority:** P0 - Critical
- **Deadline:** 2026-09-11
- **Status:** TODO
- **Assignee:** rcilomba
- **Tags:** frontend, ui, required, gate:3-features, stream:A-identity
- **Dependencies:** 05-nextjs-tailwind-shadcn.md, 07-typescript-strict-config.md, 06-backend-project-setup.md
- **Estimated Effort:** 12h

## Requirements

- Login page with authentication
- Search functionality for patients
- Patient view that varies by role
- Medical records display
- Notes creation with visibility options
- Access logs display
- Responsive design
- Must use a framework (not plain HTML) — React via Next.js (kickoff decision)

The examples below are optional starter patterns. React Query, typed fetch helpers, and the exact hook structure may be replaced with equivalent tools; backend authorization and clear loading/error states remain required.

## User Stories

### Authentication
- **US-01:** As a user, I want to log in with my username and password so that I can access the system securely
- **US-02:** As a user, I want to see my role displayed after login so that I know what I can access
- **US-03:** As a user, I want to log out so that my session is terminated

### Patient Search
- **US-04:** As a doctor/nurse/ambulance, I want to search for patients by name so that I can find their records quickly
- **US-05:** As a doctor/nurse/ambulance, I want to see search results with patient name, DOB, and record count so that I can identify the right patient

### Patient View
- **US-06:** As a doctor, I want to see all patient records so that I can provide comprehensive care
- **US-07:** As a nurse/ambulance, I want to see patient records so that I can assist with treatment
- **US-08:** As a patient, I want to see only my own records so that my privacy is protected
- **US-09:** As a patient, I want to see who accessed my records so that I can monitor my privacy

### Medical Notes
- **US-10:** As a doctor/nurse/ambulance, I want to create notes with different visibility levels so that I can control who sees them
- **US-11:** As a doctor/nurse/ambulance, I want to create private notes so that only I can see them
- **US-12:** As a doctor/nurse/ambulance, I want to create healthcare notes so that other healthcare staff can see them
- **US-13:** As a doctor/nurse/ambulance, I want to create public notes so that patients can see them
- **US-14:** As a patient, I want to see only public notes so that I don't see private healthcare discussions

### Access Logs
- **US-15:** As a doctor/nurse/ambulance, I want to see access logs so that I can track who viewed patient data
- **US-16:** As a patient, I want to see access logs so that I can monitor who accessed my records
- **US-17:** As a patient, I want to see that access logs are on the blockchain so that I trust the system

### Real-time Updates
- **US-18:** As a user, I want to see new notes appear in real-time so that I don't have to refresh the page
- **US-19:** As a user, I want to see updates from other servers so that I have the latest information

## Test-First Checkpoint

- Start with a component or Playwright test for the login shell, loading state, and invalid-login feedback.
- Add the smallest UI implementation that makes the focused test pass before expanding the page structure.

## Design

### Tech Stack (decided at kickoff)
- **Next.js (App Router) + React + TypeScript** — fullstack; UI pages and route handlers in one app
- **Tailwind CSS + shadcn/ui** — styling and accessible components (task 05 scaffold)
- Optional: **TanStack React Query** for client-side server state

### Page Structure

```
/login              - Login page
/dashboard          - Main dashboard after login
/patients           - Patient search (doctor/nurse/ambulance)
/patients/:id       - Patient details view
/patients/:id/records - Patient medical records
/patients/:id/access-logs - Patient access logs
/profile            - User profile
```

### Component Architecture

```
src/
├── app/                    # App Router routes = pages
│   ├── page.tsx
│   ├── login/
│   ├── access-denied/
│   ├── dashboard/
│   ├── patients/
│   │   └── [id]/           # journal view per role
│   └── api/                # route handlers (backend) — see task 06
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── LogoutButton.tsx
│   ├── patients/
│   │   ├── PatientSearch.tsx
│   │   ├── PatientCard.tsx
│   │   └── PatientList.tsx
│   ├── records/
│   │   ├── RecordList.tsx
│   │   ├── RecordCard.tsx
│   │   └── RecordForm.tsx
│   ├── notes/
│   │   ├── NoteList.tsx
│   │   ├── NoteCard.tsx
│   │   └── NoteForm.tsx
│   └── common/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Loading.tsx
└── lib/                    # shared types + typed fetch client
```

### Optional React Query API Pattern

For server data such as patients, records, notes, and access logs, keep calls in one authenticated typed client and use stable query keys. Import the shared request/response types from `src/lib/types/api.ts` (the same types route handlers use — no OpenAPI/generated.ts toolchain). Keep form state and visual state local to components.

```tsx
import { useQuery } from '@tanstack/react-query';
import type { User } from '@/lib/types/api';
import { api } from '@/lib/api/client';

export function useCurrentUser() {
	return useQuery<User>({
		queryKey: ['current-user'],
		queryFn: () => api.get('/api/auth/me'),
		retry: false,
	});
}
```

Render explicit loading, error, empty, and success states. The query key improves caching and refetching; it does not grant access to data.

### UI Mockups

#### Login Page
```
┌─────────────────────────────────────┐
│           HealthAccess              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Username                    │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ Password                    │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │         Login               │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

#### Patient Search (Doctor View)
```
┌─────────────────────────────────────┐
│ Header: HealthAccess    [Logout]    │
├─────────────────────────────────────┤
│ Sidebar: Patients | Records | Logs  │
├─────────────────────────────────────┤
│ Search: [_______________] [Search]  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Patient: Anna Andersson         │ │
│ │ DOB: 1985-03-15                 │ │
│ │ Records: 5 | Notes: 3           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Patient: Erik Eriksson          │ │
│ │ DOB: 1992-07-22                 │ │
│ │ Records: 2 | Notes: 1           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Tasks

- [x] Choose frontend framework → Next.js + React (kickoff)
- [ ] Set up project structure with App Router routes (from task 05 scaffold)
- [ ] Create login page with form validation
- [ ] Implement authentication context/state management
- [ ] Create protected route component
- [ ] Build patient search interface
- [ ] Create patient detail view
- [ ] Build medical records display
- [ ] Create notes interface with visibility selector
- [ ] Implement access logs display
- [ ] Add loading states and error handling
- [ ] Style with CSS framework (Tailwind, Bootstrap, or Material UI)
- [ ] Make responsive for different screen sizes
- [ ] Add form validation throughout
- [ ] Create reusable UI components

## Done Criteria

- [ ] Login page works with all 5 roles
- [ ] Dashboard shows role-appropriate content
- [ ] Patient search works and displays results
- [ ] Patient view varies by role correctly
- [ ] Medical records are displayed properly
- [ ] Notes can be created with visibility options
- [ ] Access logs are shown to authorized users
- [ ] UI is responsive and user-friendly
- [ ] All forms have proper validation
- [ ] Loading states are shown during API calls
- [ ] Error messages are displayed clearly

## Notes

- Use shadcn/ui components from the task 05 scaffold
- Make sure to handle token expiration gracefully
- Implement proper loading skeletons instead of spinners
- Prefer server components where possible; use 'use client' for interactive parts
- Consider lazy loading for better performance

## Questions to Resolve

- [x] React vs Vue vs Svelte? → React in Next.js (kickoff)
- [x] Which CSS framework? → Tailwind + shadcn/ui (kickoff)
- [ ] State management approach? (Context API vs TanStack Query)
- [x] Component library? → shadcn/ui (kickoff)
