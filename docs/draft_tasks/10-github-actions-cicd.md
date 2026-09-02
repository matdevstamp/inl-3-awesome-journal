# Task: GitHub Actions CI/CD Workflow

## Metadata
- **Priority:** P0 - Critical
- **Deadline:** 2026-09-08
- **Status:** TODO
- **Assignee:** TBD
- **Tags:** ci/cd, github-actions, automation, required, gate:2-scaffold
- **Dependencies:** 05-vite-tailwind-shadcn.md, 08-eslint-prettier-config.md, 07-typescript-strict-config.md, 06-backend-project-setup.md
- **Estimated Effort:** 3h

## Requirements

- Automated checks on pull requests
- Linting and type checking before merge
- Unit tests run automatically

## User Stories

- As a maintainer, I want every pull request checked automatically so that broken code cannot reach `main` unnoticed.
- As a contributor, I want fast feedback on lint, types, tests, and builds so that I can repair my branch before review.
- Build verification
- Branch protection rules

## Design

### Workflow: PR Validation

```yaml
# .github/workflows/pr-validation.yml
name: PR Validation

on:
  pull_request:
    branches: [main, develop]

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
          cache-dependency-path: |
            src/frontend/package-lock.json
            src/backend/package-lock.json

      - name: Install frontend dependencies
        working-directory: src/frontend
        run: npm ci

      - name: Run ESLint
        working-directory: src/frontend
        run: npm run lint

      - name: Check Prettier formatting
        working-directory: src/frontend
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
          cache-dependency-path: |
            src/frontend/package-lock.json
            src/backend/package-lock.json

      - name: Install frontend dependencies
        working-directory: src/frontend
        run: npm ci

      - name: Run TypeScript check
        working-directory: src/frontend
        run: npx tsc --noEmit

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: [lint, typecheck]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: |
            src/frontend/package-lock.json
            src/backend/package-lock.json

      - name: Install frontend dependencies
        working-directory: src/frontend
        run: npm ci

      - name: Run unit tests
        working-directory: src/frontend
        run: npm test

      - name: Upload test coverage
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: src/frontend/coverage/

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
          cache-dependency-path: |
            src/frontend/package-lock.json
            src/backend/package-lock.json

      - name: Install frontend dependencies
        working-directory: src/frontend
        run: npm ci

      - name: Build frontend
        working-directory: src/frontend
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: src/frontend/dist/
```

### Workflow: Backend Validation

```yaml
# .github/workflows/backend-validation.yml
name: Backend Validation

on:
  pull_request:
    branches: [main, develop]
    paths:
      - 'src/backend/**'

permissions:
  contents: read

jobs:
  lint:
    name: Backend Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: src/backend/package-lock.json

      - name: Install dependencies
        working-directory: src/backend
        run: npm ci

      - name: Run ESLint
        working-directory: src/backend
        run: npm run lint

  typecheck:
    name: Backend TypeScript Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: src/backend/package-lock.json

      - name: Install dependencies
        working-directory: src/backend
        run: npm ci

      - name: Run TypeScript check
        working-directory: src/backend
        run: npx tsc --noEmit

  test:
    name: Backend Tests
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
          cache-dependency-path: src/backend/package-lock.json

      - name: Install dependencies
        working-directory: src/backend
        run: npm ci

      - name: Run migrations
        working-directory: src/backend
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/healthaccess_test
        run: npm run db:migrate

      - name: Run tests
        working-directory: src/backend
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/healthaccess_test
          JWT_SECRET: test-secret
        run: npm test
```

### Branch Protection Rules

```yaml
# Branch protection settings (configure in GitHub UI or via API)
# Settings > Branches > Add rule

Branch name pattern: main
Settings:
  - ✅ Require pull request reviews before merging
    - Required approving reviews: 1
    - Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require status checks to pass before merging
    - Required checks:
      - lint
      - typecheck
      - test
      - build
  - ✅ Require branches to be up to date before merging
  - ✅ Require conversation resolution before merging
  - ✅ Require linear history (squash merging)
  - ❌ Allow force pushes (disabled)
  - ❌ Allow deletions (disabled)
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
- [ ] Create PR validation workflow
- [ ] Create backend validation workflow
- [ ] Configure branch protection rules
- [ ] Create PR template
- [ ] Add status badges to README
- [ ] Test workflows on a PR
- [ ] Document workflow in README

## Done Criteria

- [ ] Workflows run on PR creation
- [ ] Lint checks pass before merge
- [ ] Type checks pass before merge
- [ ] Tests pass before merge
- [ ] Build succeeds before merge
- [ ] Branch protection prevents direct pushes
- [ ] PR template is used
- [ ] Status badges show in README

## Notes

- Use `npm ci` instead of `npm install` for deterministic builds
- Cache node_modules to speed up workflows
- Use services for database in backend tests
- Consider adding code coverage reporting

## Questions to Resolve

- [ ] Should we deploy on merge to main?
- [ ] Which hosting platform for deployment?
- [ ] Should we run E2E tests in CI?
