# Task: GitHub Actions CI/CD Workflow

## Metadata
- **Priority:** P0 - Critical
- **Deadline:** 2026-09-08
- **Status:** TODO
- **Assignee:** matdevstamp
- **Tags:** ci/cd, github-actions, automation, required, gate:2-scaffold
- **Dependencies:** 05-nextjs-tailwind-shadcn.md, 08-eslint-prettier-config.md, 07-typescript-strict-config.md, 06-backend-project-setup.md
- **Related:** 09-playwright-e2e-testing.md
- **Estimated Effort:** 3h

## Requirements

- Automated checks on pull requests
- Linting and type checking before merge
- Unit tests run automatically
- Build verification
- Apply the branch ruleset (app code via PR + 1 review; docs/ + `project_management/` push direct) — kickoff decision, enforced later

## User Stories

- As a maintainer, I want every pull request checked automatically so that broken code cannot reach `main` unnoticed.
- As a contributor, I want fast feedback on lint, types, tests, and builds so that I can repair my branch before review.
- As the lead, I want the GitHub ruleset to block direct pushes of app code while still allowing docs/logbook updates straight to `main`.

## Design

The project is one Next.js app at the repo root (no `src/frontend` + `src/backend` split). One workflow validates the whole app; Playwright E2E runs as a second job (see task 09).

### Workflow: PR Validation

```yaml
# .github/workflows/pr-validation.yml
name: PR Validation

on:
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  lint:
    name: Lint & Format
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Check Prettier formatting
        run: npm run format:check

  typecheck:
    name: TypeScript Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run TypeScript check
        run: npx tsc --noEmit

  test:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    needs: [lint, typecheck]
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: healthaccess_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/healthaccess_test
        run: npx prisma migrate deploy

      - name: Run tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/healthaccess_test
          JWT_SECRET: test-secret
        run: npm test

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build the Next.js app
        run: npm run build
```

E2E tests run against two dev servers (ports 3001/3002) in the same or a dedicated job — see the CI snippet in task 09.

### Branch Protection Rules (deferred)

The kickoff agreed a special rule but deferred the GitHub ruleset config ("apply later, before the first app-code PR"). When applied, configure a ruleset on `main` (Settings > Rules > Rulesets):

```text
Ruleset name: main
Enforcement: Active
Target branches: main
Rules:
  - ✅ Require a pull request before merging
    - Required approvals: 1
    - Dismiss stale approvals on new pushes
  - ✅ Require status checks to pass
    - Checks: lint, typecheck, test, build
  - ✅ Require branches to be up to date
  - ✅ Block force pushes and deletions

Note: the agreed carve-out — everything under docs/ and the Python tooling
(project_management/) may push directly — is a team convention recorded in
gruppkontrakt.md. GitHub rulesets apply per-branch, not per-path, so the
convention stands alongside the ruleset; do not surprise teammates with rule
enforcement mid-sprint. Revisit whether a path-scoped exception is feasible
before enabling.
```

### PR Template

```markdown
<!-- .github/pull_request_template.md -->
## Description

[Describe your changes here]

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)

## Related Issues

Closes #[issue number]

## Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published in downstream modules

## Screenshots (if applicable)

[Add screenshots here]
```

## Tasks

- [ ] Create .github/workflows directory
- [ ] Create PR validation workflow (lint, typecheck, test, build) for the single Next.js app
- [ ] Add the Playwright E2E job (task 09) with the PostgreSQL service
- [ ] Apply the GitHub ruleset on `main` (PR + 1 review; status checks)
- [ ] Create PR template
- [ ] Add status badges to README
- [ ] Test workflows on a real PR
- [ ] Document workflow in README

## Done Criteria

- [ ] Workflows run on PR creation
- [ ] Lint checks pass before merge
- [ ] Type checks pass before merge
- [ ] Tests pass before merge
- [ ] Build succeeds before merge
- [ ] Ruleset blocks direct app-code pushes to `main`
- [ ] Docs-only changes still follow the agreed convention
- [ ] PR template is used
- [ ] Status badges show in README

## Notes

- Use `npm ci` instead of `npm install` for deterministic builds
- Cache node_modules to speed up workflows
- Use the PostgreSQL service container for tests (matches the chosen database)
- Docs/`project_management/` changes do not need the full pipeline — they push directly per the group contract

## Questions to Resolve

- [ ] Should we deploy on merge to main?
- [ ] Should we run E2E tests in CI from the start or only near Gate 4?
- [ ] Can the ruleset enforce the docs-direct carve-out per path?
