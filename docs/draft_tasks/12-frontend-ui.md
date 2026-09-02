# Task: Frontend UI Development

## Metadata
- **Priority:** P0 - Critical
- **Deadline:** 2026-09-16
- **Status:** TODO
- **Assignee:** TBD
- **Tags:** frontend, ui, required
- **Dependencies:** 05-vite-tailwind-shadcn.md, 07-typescript-strict-config.md, 06-backend-project-setup.md
- **Estimated Effort:** 12h

## Requirements

- Login page with authentication
- Search functionality for patients
- Patient view that varies by role
- Medical records display
- Notes creation with visibility options
- Access logs display
- Responsive design
- Must use a framework (not plain HTML)

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

### Tech Stack Options
- **React** (recommended) - Large ecosystem, easy to learn
- **Vue** - Good for quick prototyping
- **Svelte** - Modern, lightweight

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
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   └── ProtectedRoute.jsx
│   ├── patients/
│   │   ├── PatientSearch.jsx
│   │   ├── PatientCard.jsx
│   │   └── PatientList.jsx
│   ├── records/
│   │   ├── RecordList.jsx
│   │   ├── RecordCard.jsx
│   │   └── RecordForm.jsx
│   ├── notes/
│   │   ├── NoteList.jsx
│   │   ├── NoteCard.jsx
│   │   └── NoteForm.jsx
│   └── common/
│       ├── Header.jsx
│       ├── Sidebar.jsx
│       └── Loading.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   ├── PatientsPage.jsx
│   ├── PatientDetailPage.jsx
│   └── ProfilePage.jsx
├── services/
│   └── api.js
└── App.jsx
```

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

- [ ] Choose frontend framework (React recommended)
- [ ] Set up project structure with routing
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

- Consider using a UI component library to speed up development
- Make sure to handle token expiration gracefully
- Implement proper loading skeletons instead of spinners
- Use React Context or Redux for state management
- Consider lazy loading for better performance

## Questions to Resolve

- [ ] React vs Vue vs Svelte? (React recommended)
- [ ] Which CSS framework? (Tailwind recommended)
- [ ] State management approach? (Context API vs Redux)
- [ ] Should we use a component library? (Material UI, Ant Design?)
