# Task: Database Design & Setup

## Metadata
- **Priority:** P0 - Critical
- **Deadline:** 2026-09-04
- **Status:** TODO
- **Assignee:** TBD
- **Tags:** database, backend, required
- **Dependencies:** 01-project-setup-group-contract.md, 02-database-choice-discussion.md, 03-graphify-architecture-artifacts.md
- **Estimated Effort:** 4h

## Requirements

- Medical records stored in SQL database (NOT on blockchain - GDPR compliance)
- Support for 5 user roles with different access levels
- Patient data must be searchable by name
- Access logs generated to blockchain when data is viewed
- Notes with visibility categories (private, healthcare, all)
- A checked-in `database/schema.dbml` file that is kept in sync with the Prisma schema
- A Mermaid entity-relationship diagram derived from the approved schema

## User Stories

### Data Storage
- **US-01:** As a system, I want to store medical records in a SQL database so that they're structured and queryable
- **US-02:** As a system, I want to NEVER store medical records on the blockchain so that we comply with GDPR
- **US-03:** As a system, I want to store access logs separately so that they can be synced to blockchain

### User Management
- **US-04:** As a system, I want to support 5 user roles so that each user has appropriate access
- **US-05:** As a system, I want to store user credentials securely so that authentication is safe
- **US-06:** As a system, I want to link users to organizations so that we can track which hospital/clinic they belong to

### Patient Data
- **US-07:** As a system, I want to store patient personal information so that we can identify them
- **US-08:** As a system, I want to support Swedish personal numbers so that we can uniquely identify patients
- **US-09:** As a system, I want to make patients searchable by name so that healthcare providers can find them

### Medical Records
- **US-10:** As a system, I want to store medical records with types so that we can categorize them
- **US-11:** As a system, I want to link records to patients and doctors so that we can track who created them
- **US-12:** As a system, I want to track record creation and update times so that we have an audit trail

### Notes
- **US-13:** As a system, I want to store notes with visibility levels so that we can control who sees them
- **US-14:** As a system, I want to link notes to records so that they're associated with the right patient data
- **US-15:** As a system, I want to track note authors so that we can show who wrote them

### Access Logs
- **US-16:** As a system, I want to log all access to patient data so that we have an audit trail
- **US-17:** As a system, I want to track which server processed the request so that we can sync between servers
- **US-18:** As a system, I want to mark logs as synced to blockchain so that we know what's been distributed

## Design

### Required Design Artifacts

- `database/schema.dbml` is the human-readable database diagram source of truth for review.
- `src/backend/prisma/schema.prisma` is the executable Prisma schema.
- `docs/diagrams/data-model.mmd` visualizes the same entities and relationships in Mermaid.
- The DBML, Mermaid diagram, Prisma schema, migrations, and README description must agree before implementation starts.

The DBML should include PostgreSQL as the target database, enums for roles and note visibility, primary keys, foreign keys, indexes supporting patient-name search, and representative records only when they contain safe fictional data.

### Database Schema

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('doctor', 'nurse', 'ambulance', 'patient', 'unauthorized') NOT NULL,
    organization_id INTEGER REFERENCES organizations(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organizations table (hospitals, clinics)
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) -- hospital, clinic, ambulance service
);

-- Patients table
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    personal_number VARCHAR(12) UNIQUE NOT NULL, -- Swedish personal number
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medical records
CREATE TABLE medical_records (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    doctor_id INTEGER REFERENCES users(id),
    record_type VARCHAR(50), -- diagnosis, prescription, lab_result, etc.
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notes with visibility control
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    record_id INTEGER REFERENCES medical_records(id),
    author_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    visibility ENUM('private', 'healthcare', 'all') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Access logs (will be synced to blockchain)
CREATE TABLE access_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    patient_id INTEGER REFERENCES patients(id),
    record_id INTEGER REFERENCES medical_records(id),
    action VARCHAR(50), -- view, edit, create
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    blockchain_synced BOOLEAN DEFAULT FALSE
);
```

### Indexes for Performance
```sql
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_notes_record ON notes(record_id);
CREATE INDEX idx_access_logs_patient ON access_logs(patient_id);
```

## Tasks

- [ ] Discuss and choose database system (see task 02-database-choice-discussion.md)
- [ ] Create Prisma schema as single source of truth
- [ ] Generate database migrations from Prisma schema
- [ ] Add appropriate indexes for search performance
- [ ] Create seed data script with test users and patients
- [ ] Document database structure in README
- [ ] Test CRUD operations for all entities
- [ ] Verify GDPR compliance (no medical records on blockchain)

## Done Criteria

- [ ] All tables created with proper relationships
- [ ] Indexes added for search operations
- [ ] Seed data script works correctly
- [ ] Database documentation is complete
- [ ] All team members can connect to database
- [ ] CRUD operations tested for all entities

## Notes

- Medical records must NEVER be stored on blockchain (GDPR requirement)
- Access logs are the only things that go to blockchain
- Consider using an ORM (Sequelize, Prisma, TypeORM) for easier database operations
- Make sure to handle Swedish personal numbers correctly

## Questions to Resolve

- [ ] PostgreSQL vs SQLite? (see task 02-database-choice-discussion.md)
- [ ] Should we use Prisma as the single source of truth?
- [ ] How to handle database seeding?
- [ ] Do we need indexes for this project scale?
