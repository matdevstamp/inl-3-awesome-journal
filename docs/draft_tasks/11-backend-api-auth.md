# Task: Backend API & Authentication

## Metadata
- **Priority:** P0 - Critical
- **Deadline:** 2026-09-16
- **Status:** TODO
- **Assignee:** TBD
- **Tags:** backend, api, auth, required, gate:3-features, stream:A-identity
- **Dependencies:** 04-database-design.md, 07-typescript-strict-config.md, 06-backend-project-setup.md
- **Estimated Effort:** 8h

## Requirements

- Login system with 5 user roles
- Role-based access control for all endpoints
- RESTful API for frontend communication
- JWT or session-based authentication
- Secure password handling

## User Stories

### Authentication
- **US-01:** As a user, I want to log in with my credentials so that I can access the system
- **US-02:** As a user, I want to receive a JWT token so that my session is secure
- **US-03:** As a user, I want to log out so that my token is invalidated
- **US-04:** As a user, I want to see my profile so that I can verify my role

### Access Control
- **US-05:** As a doctor, I want to access all patient data so that I can provide care
- **US-06:** As a nurse/ambulance, I want to access patient records so that I can assist with treatment
- **US-07:** As a patient, I want to access only my own data so that my privacy is protected
- **US-08:** As an unauthorized user, I want to see "Access Denied" so that I know I can't access the system

### Patient Data
- **US-09:** As a healthcare provider, I want to search patients by name so that I can find them quickly
- **US-10:** As a healthcare provider, I want to view patient details so that I can see their information
- **US-11:** As a healthcare provider, I want to view patient records so that I can see their medical history
- **US-12:** As a healthcare provider, I want to create medical records so that I can document patient care

### Notes
- **US-13:** As a healthcare provider, I want to create notes with visibility levels so that I can control who sees them
- **US-14:** As a healthcare provider, I want to edit my notes so that I can correct mistakes
- **US-15:** As a healthcare provider, I want to delete my notes so that I can remove incorrect information

### Access Logs
- **US-16:** As a user, I want to view access logs so that I can see who accessed patient data
- **US-17:** As a patient, I want to see who viewed my records so that I can monitor my privacy
- **US-18:** As a system, I want to log all access to the blockchain so that it's immutable

## Test-First Checkpoint

- Write API tests for valid login, invalid credentials, and the role-bearing session/token response before implementing the route.
- Keep the test data fictional and assert that authentication failures do not disclose patient data.

## Design

### API Endpoints

```
POST   /api/auth/login          - User login
POST   /api/auth/logout         - User logout
GET    /api/auth/me             - Get current user

GET    /api/patients            - Search patients (by name)
GET    /api/patients/:id        - Get patient details
GET    /api/patients/:id/records - Get patient medical records
GET    /api/patients/:id/access-logs - Get patient access logs

POST   /api/records             - Create medical record
PUT    /api/records/:id         - Update medical record
GET    /api/records/:id         - Get single record

POST   /api/notes               - Create note
PUT    /api/notes/:id           - Update note
GET    /api/records/:id/notes   - Get notes for record

POST   /api/access-log          - Log access to blockchain
```

### Authentication Flow

```
1. User submits credentials
2. Backend validates against database
3. JWT token generated with user role
4. Token sent to frontend
5. Frontend includes token in all requests
6. Backend validates token on each request
7. Role-based middleware checks permissions
```

### Role Permissions Matrix

| Action | Doctor | Nurse | Ambulance | Patient | Unauthorized |
|--------|--------|-------|-----------|---------|--------------|
| View own profile | ✅ | ✅ | ✅ | ✅ | ❌ |
| Search patients | ✅ | ✅ | ✅ | ❌ | ❌ |
| View patient records | ✅ | ✅ | ✅ | Own only | ❌ |
| Create records | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create notes (private) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create notes (healthcare) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create notes (all) | ✅ | ✅ | ✅ | ❌ | ❌ |
| View access logs | ✅ | ✅ | ✅ | Own only | ❌ |

## Tasks

- [ ] Set up Node.js/Express backend
- [ ] Implement authentication middleware (JWT)
- [ ] Create login/logout endpoints
- [ ] Implement role-based access control middleware
- [ ] Create patient search endpoint
- [ ] Create medical records CRUD endpoints
- [ ] Create notes CRUD endpoints with visibility control
- [ ] Implement access logging endpoint
- [ ] Add input validation and error handling
- [ ] Write API documentation
- [ ] Set up CORS for frontend communication
- [ ] Implement rate limiting for security

## Done Criteria

- [ ] All API endpoints functional
- [ ] Authentication works for all 5 roles
- [ ] Role-based access control enforced
- [ ] Input validation prevents bad data
- [ ] Error responses are meaningful
- [ ] API documentation is complete
- [ ] CORS configured correctly
- [ ] Rate limiting prevents abuse

## Notes

- Consider using Passport.js for authentication
- Use bcrypt for password hashing
- Implement refresh tokens for better UX
- Log all authentication attempts for security
- Consider passwordless login option (course allows it)

## Questions to Resolve

- [ ] JWT vs session-based auth? (JWT recommended for simplicity)
- [ ] Should we implement passwordless login?
- [ ] How long should tokens be valid?
- [ ] Should we use an API framework like Fastify instead of Express?
