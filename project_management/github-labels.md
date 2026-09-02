# GitHub Labels for HealthAccess Project

Priority is managed through a GitHub Projects custom field rather than labels.

Status and priority are managed through GitHub Projects custom fields rather than labels.

## Type Labels
- `type:feature` - New functionality (light blue)
- `type:bug` - Something broken (red)
- `type:docs` - Documentation only (light green)
- `type:chore` - Maintenance, config, setup (light gray)
- `type:testing` - Test creation or updates (light purple)
- `type:architecture` - Design decisions, diagrams (dark blue)

## Area Labels
- `area:frontend` - UI, React, Tailwind, shadcn (light blue)
- `area:backend` - API, Node.js, Express (green)
- `area:database` - PostgreSQL, Prisma, migrations (orange)
- `area:blockchain` - Access logging, chain verification (purple)
- `area:p2p` - Two-server, Socket.IO, real-time (pink)
- `area:auth` - Authentication, authorization, roles (red)
- `area:devops` - CI/CD, GitHub Actions, Docker (gray)

## Stream Labels (for parallel work)
- `stream:A-identity` - Auth, login, roles (assigned to Person 1)
- `stream:B-patient` - Patient search, records (assigned to Person 3)
- `stream:C-notes` - Medical notes, visibility (assigned to TBD)
- `stream:D-audit` - Blockchain, P2P, Socket.IO (assigned to Person 4)

## Gate Labels
- `gate:1-decisions` - Contract, repo setup, decisions
- `gate:2-scaffold` - Monorepo, tooling, CI
- `gate:3-features` - Four parallel feature streams
- `gate:4-integration` - Authorization, real-time
- `gate:5-delivery` - Tests, docs, presentation

## Effort Labels
- `effort:quick` - Under 2 hours
- `effort:medium` - 2-4 hours
- `effort:large` - 4+ hours

## Dependency Labels
- `dep:blocked-by` - Requires another issue first
- `dep:blocks` - Other issues depend on this

---

## Color Legend

| Color | Hex |
|-------|-----|
| Red | #d73a4a |
| Orange | #e99695 |
| Yellow | #fbca04 |
| Green | #0e8a16 |
| Dark Green | #1d76db |
| Blue | #0075ca |
| Light Blue | #c5def5 |
| Purple | #7057ff |
| Pink | #d93f0b |
| Gray | #ededed |
| Light Gray | #c4c4c4 |
