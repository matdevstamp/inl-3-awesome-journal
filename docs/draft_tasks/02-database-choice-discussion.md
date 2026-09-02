# Task: Database Choice Discussion

## Metadata
- **Priority:** P0 - Critical
- **Deadline:** 2026-09-04
- **Status:** TODO
- **Assignee:** Team
- **Tags:** database, architecture, decision, required, gate:1-decisions
- **Dependencies:** 01-project-setup-group-contract.md
- **GitHub Issue:** #2 (https://github.com/matdevstamp/inl-3-awesome-journal/issues/2)
- **Estimated Effort:** 1h (meeting)

## Requirements

- Choose database system for the project
- Must work with Prisma ORM
- Must support migrations
- Must be suitable for development and testing

## User Stories

- As a team, we want one agreed database choice so that scaffold and feature branches do not diverge.
- As a developer, I want a reproducible local database setup so that every teammate can run the same migrations and seed data.
- As the system, we want a database suited to two simultaneous servers so that the required distributed demo is realistic.

## Design

### Decision: SQLite vs PostgreSQL

### Option A: SQLite

**Pros:**
- Zero configuration, file-based
- No server process needed
- Perfect for development and testing
- Fast for read-heavy workloads
- Easy to share database file between team members
- Works offline

**Cons:**
- Limited concurrent write support
- No network access (single-file database)
- Fewer features than PostgreSQL
- May need to switch for production

**Best for:** Development, testing, small projects, offline-first apps

### Option B: PostgreSQL

**Pros:**
- Full-featured SQL database
- Excellent concurrent access
- Advanced features (JSON, full-text search, etc.)
- Industry standard for production
- Better for multi-server setup (P2P requirement)

**Cons:**
- Requires server setup
- More complex configuration
- Heavier for development
- Need Docker or local installation

**Best for:** Production, multi-user apps, complex queries, enterprise

### Option C: SQLite for Dev, PostgreSQL for Production

**Pros:**
- Best of both worlds
- Fast development with SQLite
- Production-ready with PostgreSQL
- Prisma supports both

**Cons:**
- May have subtle differences between databases
- Need to test on both databases
- Migration differences possible

**Best for:** Projects that need fast development but production readiness

## Recommendation

For this project, I recommend **Option C: SQLite for development, PostgreSQL for production**.

**Rationale:**
1. **Development speed:** SQLite requires zero setup, team can start immediately
2. **P2P requirement:** PostgreSQL is better for multi-server setup
3. **Prisma support:** Prisma handles both databases seamlessly
4. **CI/CD:** GitHub Actions can use PostgreSQL service for testing

### Prisma Configuration

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"  // Change to "postgresql" for production
  url      = env("DATABASE_URL")
}
```

### Environment Variables

```bash
# .env (development)
DATABASE_URL="file:./dev.db"

# .env.production
DATABASE_URL="postgresql://user:password@localhost:5432/healthaccess"
```

## Tasks

- [ ] Schedule team meeting to discuss database choice
- [ ] Present SQLite vs PostgreSQL comparison
- [ ] Discuss P2P requirements and database implications
- [ ] Make final decision as a team
- [ ] Document decision in README
- [ ] Update task files with chosen database

## Done Criteria

- [ ] Team has discussed database options
- [ ] Decision is documented
- [ ] Prisma schema is configured for chosen database
- [ ] Environment variables are set up
- [ ] All team members understand the choice

## Notes

- Prisma schema is the single source of truth for database structure
- Migrations are generated from Prisma schema, not written manually
- Use `prisma migrate dev` for development
- Use `prisma migrate deploy` for production
- The schema.prisma file defines what the database should look like

## Questions to Resolve

- [ ] Which database do we choose? (SQLite, PostgreSQL, or both?)
- [ ] How to handle the P2P requirement with the chosen database?
- [ ] Should we use Docker for PostgreSQL in development?
- [ ] How to handle database seeding?
