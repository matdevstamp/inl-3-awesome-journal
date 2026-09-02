# Task: Testing & Quality Assurance

## Metadata
- **Priority:** P1 - High
- **Deadline:** 2026-09-29
- **Status:** TODO
- **Assignee:** TBD
- **Tags:** testing, quality, required, gate:5-delivery
- **Dependencies:** 17-user-roles-access-control.md, 15-blockchain-access-logging.md, 16-p2p-network.md, 18-socketio-broadcasting.md
- **Estimated Effort:** 8h

## Requirements

- Work test-driven (TDD recommended)
- Test all critical paths
- Test role-based access control

## Bug-Fix Workflow

Use `docs/bug-reports.csv` as a lightweight raw intake log. The lead triages each report and converts valid defects into a draft task or GitHub issue. For a user-visible defect, reproduce the behavior with a focused Playwright E2E test before fixing it: the test is **red** for the known failure, the implementation fix makes it **green**, and the test remains in CI as regression protection.

Do not put patient data, credentials, tokens, or other secrets in the raw report. Use fictional identifiers and sanitized evidence only.

## User Stories

- As a team, we want tests for every required role and visibility rule so that regressions are caught before the demo.
- As a reviewer, I want tests for URL tampering and the SQL/blockchain boundary so that the most serious risks are explicit.
- As a contributor, I want focused test commands so that I can validate a stream before opening a PR.

## Test-First Checkpoint

- Before coding each feature, add at least one acceptance test for the required happy path and one denial, validation, or failure case.
- Keep tests close to the behavior they protect: backend policy tests for authorization and visibility, frontend tests for rendering and interactions, and Playwright tests for complete user journeys.
- A failing test is acceptable while a feature is being started; a task is not done until its focused tests are green and included in CI.
- Test blockchain integrity
- Test P2P synchronization
- Document test results

## Design

### Testing Strategy

```
Testing Levels:
├── Unit Tests (70%)
│   ├── Database queries
│   ├── Authentication logic
│   ├── Access control logic
│   └── Utility functions
├── Integration Tests (20%)
│   ├── API endpoints
│   ├── Database operations
│   └── Socket.io events
└── E2E Tests (10%)
    ├── Login flow
    ├── Patient search
    ├── Note creation
    └── Access logging
```

### Test Cases by Feature

#### Authentication & Access Control
```
✅ Test login with valid credentials (all 5 roles)
✅ Test login with invalid credentials
✅ Test access to protected routes without token
✅ Test role-based access (doctor vs patient vs unauthorized)
✅ Test patient cannot access other patients' data
✅ Test URL manipulation prevention
✅ Test token expiration handling
```

#### Patient Search
```
✅ Test search by name (first, last, partial)
✅ Test search with Swedish characters (å, ä, ö)
✅ Test search with pagination
✅ Test search with filters
✅ Test empty search results
✅ Test search performance with large dataset
```

#### Medical Notes
```
✅ Test note creation with all visibility levels
✅ Test private notes only visible to author
✅ Test healthcare notes visible to healthcare staff
✅ Test "all" notes visible to patients
✅ Test note editing by author
✅ Test note deletion with confirmation
✅ Test note access logging
```

#### Blockchain & P2P
```
✅ Test access log creation
✅ Test blockchain integrity verification
✅ Test blockchain sync between servers
✅ Test tamper detection
✅ Test P2P communication
✅ Test server disconnection handling
✅ Test data consistency after reconnection
```

### Test Data Setup

```javascript
// Test users
const testUsers = {
    doctor: { username: 'dr_test', password: 'test123', role: 'doctor' },
    nurse: { username: 'nurse_test', password: 'test123', role: 'nurse' },
    ambulance: { username: 'amb_test', password: 'test123', role: 'ambulance' },
    patient: { username: 'patient_test', password: 'test123', role: 'patient' },
    unauthorized: { username: 'unauth_test', password: 'test123', role: 'unauthorized' }
};

// Test patients
const testPatients = [
    { id: 1, name: 'Anna Andersson', personalNumber: '198503151234' },
    { id: 2, name: 'Erik Eriksson', personalNumber: '199207225678' }
];
```

## Tasks

- [ ] Set up testing framework (Jest, Mocha, or Cypress)
- [ ] Write unit tests for authentication
- [ ] Write unit tests for access control
- [ ] Write integration tests for API endpoints
- [ ] Write tests for patient search
- [ ] Write tests for medical notes
- [ ] Write tests for blockchain operations
- [ ] Write tests for P2P synchronization
- [ ] Create test data fixtures
- [ ] Set up CI/CD pipeline for automated testing
- [ ] Document test results
- [ ] Fix any failing tests

## Done Criteria

- [ ] Testing framework is set up
- [ ] Unit tests cover critical logic
- [ ] Integration tests cover API endpoints
- [ ] All 5 roles are tested
- [ ] Access control is thoroughly tested
- [ ] Blockchain integrity is verified
- [ ] P2P sync is tested
- [ ] Test coverage is at least 70%
- [ ] All tests pass
- [ ] Test results are documented
- [ ] CI/CD pipeline runs tests automatically

## Notes

- Focus on testing security-critical paths first
- Use mock data for consistent testing
- Test edge cases and error conditions
- Document any known issues or limitations
- Consider using test databases separate from development

## Questions to Resolve

- [ ] Which testing framework to use? (Jest recommended for Node.js)
- [ ] How to set up test database?
- [ ] Should we implement E2E tests with Cypress?
- [ ] How to handle socket.io testing?
