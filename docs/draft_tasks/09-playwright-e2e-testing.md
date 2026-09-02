# Task: Playwright E2E Testing

## Metadata
- **Priority:** P1 - High
- **Deadline:** 2026-09-08 (runner and fixtures), 2026-09-29 (critical flows) (runner and fixtures), 2026-09-29 (critical flows)
- **Status:** TODO
- **Assignee:** TBD
- **Tags:** testing, e2e, playwright, required, gate:2-scaffold
- **Dependencies:** 05-vite-tailwind-shadcn.md, 06-backend-project-setup.md, 07-typescript-strict-config.md, 08-eslint-prettier-config.md
- **Estimated Effort:** 8h

## Requirements

- End-to-end tests simulating real user flows
- Test all 5 user roles
- Test critical paths (login, search, records, notes)
- Regression testing for bug prevention
- CI/CD integration

The examples below are optional starter patterns, not extra acceptance criteria. Keep the required flows and assertions, but adapt the fixture and configuration style to the project structure.

## User Stories

- As a presenter, I want the critical role-based journey automated so that the ten-minute demo is repeatable.
- As a team member, I want a browser test for the two-server note flow so that integration evidence is not manual memory.

## Test-First Starting Point

Write this immediately after the scaffold exposes a frontend URL, before implementing login or the dashboard:

```typescript
import { test, expect } from '@playwright/test';

test('the application exposes a login entry point', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
});
```

This is intentionally a small red test until the login shell exists. Make it green before feature streams fork. Each later user story adds a focused Playwright or API test before its implementation begins.

## Design

Playwright is deliberately split into two increments. Configure the runner, fixtures, and the first smoke test during the scaffold gate. Add role journeys, visibility checks, and the two-server scenario after integration tasks 17-19 are complete.

### Why Playwright?

- **Cross-browser:** Chromium, Firefox, WebKit
- **Auto-wait:** No flaky tests from timing issues
- **Codegen:** Record tests by interacting with the app
- **Traces:** Debug failures with screenshots and videos
- **API testing:** Can test backend directly
- **Parallel execution:** Fast test suites

### Project Structure

```
src/frontend/
├── tests/
│   ├── e2e/
│   │   ├── auth/
│   │   │   ├── login.spec.ts
│   │   │   └── logout.spec.ts
│   │   ├── patients/
│   │   │   ├── search.spec.ts
│   │   │   └── view.spec.ts
│   │   ├── records/
│   │   │   ├── view.spec.ts
│   │   │   └── create.spec.ts
│   │   ├── notes/
│   │   │   ├── create.spec.ts
│   │   │   ├── visibility.spec.ts
│   │   │   └── realtime.spec.ts
│   │   ├── access-logs/
│   │   │   └── view.spec.ts
│   │   └── blockchain/
│   │       └── verify.spec.ts
│   ├── fixtures/
│   │   ├── auth.fixture.ts
│   │   └── test-data.ts
│   └── helpers/
│       ├── api.helper.ts
│       └── db.helper.ts
├── playwright.config.ts
└── package.json
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      cwd: './',
    },
    {
      command: 'npm run dev:backend',
      url: 'http://localhost:3001/health',
      reuseExistingServer: !process.env.CI,
      cwd: '../backend',
    },
  ],
});
```

### Optional Quick Start

```bash
npm install -D @playwright/test
npx playwright install
npx playwright codegen http://localhost:5173/login
npx playwright test --reporter=list
```

For CI, the reference projects use a single worker, retries, and failure artifacts. A small reusable authenticated state can reduce repeated login setup:

```typescript
import { test as setup } from '@playwright/test';

setup('save authenticated state', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill(process.env.E2E_USERNAME ?? 'test-user');
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD ?? 'test-password');
  await page.getByRole('button', { name: /log in/i }).click();
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

### Test Fixtures

```typescript
// tests/fixtures/auth.fixture.ts
import { test as base, type Page } from '@playwright/test';

type TestUser = {
  username: string;
  password: string;
  role: string;
};

const TEST_USERS: Record<string, TestUser> = {
  doctor: { username: 'dr_test', password: 'test123', role: 'doctor' },
  nurse: { username: 'nurse_test', password: 'test123', role: 'nurse' },
  ambulance: { username: 'amb_test', password: 'test123', role: 'ambulance' },
  patient: { username: 'patient_test', password: 'test123', role: 'patient' },
  unauthorized: { username: 'unauth_test', password: 'test123', role: 'unauthorized' },
};

export const test = base.extend<{ loginAs: (role: string) => Promise<Page> }>({
  loginAs: async ({ page }, use) => {
    const loginAs = async (role: string) => {
      const user = TEST_USERS[role];
      
      await page.goto('/login');
      await page.fill('[name="username"]', user.username);
      await page.fill('[name="password"]', user.password);
      await page.click('button[type="submit"]');
      
      // Wait for navigation based on role
      if (role === 'patient') {
        await page.waitForURL('/my-records');
      } else if (role === 'unauthorized') {
        await page.waitForURL('/access-denied');
      } else {
        await page.waitForURL('/dashboard');
      }
      
      return page;
    };
    
    await use(loginAs);
  },
});

export { expect } from '@playwright/test';
```

### Example Tests

```typescript
// tests/e2e/auth/login.spec.ts
import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Login', () => {
  test('should login as doctor and see dashboard', async ({ loginAs, page }) => {
    await loginAs('doctor');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should login as patient and see own records', async ({ loginAs, page }) => {
    await loginAs('patient');
    await expect(page).toHaveURL('/my-records');
    await expect(page.locator('text=My Health Record')).toBeVisible();
  });

  test('should show access denied for unauthorized', async ({ loginAs, page }) => {
    await loginAs('unauthorized');
    await expect(page).toHaveURL('/access-denied');
    await expect(page.locator('text=Access Denied')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="username"]', 'invalid');
    await page.fill('[name="password"]', 'invalid');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});
```

```typescript
// tests/e2e/patients/search.spec.ts
import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Patient Search', () => {
  test('should search patients by name', async ({ loginAs, page }) => {
    await loginAs('doctor');
    
    await page.goto('/patients');
    await page.fill('[placeholder="Search patients..."]', 'Anna');
    await page.click('button:has-text("Search")');
    
    await expect(page.locator('text=Anna Andersson')).toBeVisible();
  });

  test('should show empty state for no results', async ({ loginAs, page }) => {
    await loginAs('doctor');
    
    await page.goto('/patients');
    await page.fill('[placeholder="Search patients..."]', 'ZZZZZ');
    await page.click('button:has-text("Search")');
    
    await expect(page.locator('text=No patients found')).toBeVisible();
  });

  test('patient cannot search other patients', async ({ loginAs, page }) => {
    await loginAs('patient');
    
    // Patient should not see search option
    await expect(page.locator('text=Search Patients')).not.toBeVisible();
  });
});
```

```typescript
// tests/e2e/notes/visibility.spec.ts
import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Note Visibility', () => {
  test('private note only visible to author', async ({ loginAs, page }) => {
    // Login as doctor and create private note
    await loginAs('doctor');
    await page.goto('/patients/1/records');
    await page.click('button:has-text("Add Note")');
    await page.fill('[name="content"]', 'Private note');
    await page.click('[value="private"]');
    await page.click('button:has-text("Save")');
    
    // Login as nurse and verify note not visible
    await loginAs('nurse');
    await page.goto('/patients/1/records');
    await expect(page.locator('text=Private note')).not.toBeVisible();
  });

  test('healthcare note visible to healthcare staff', async ({ loginAs, page }) => {
    // Login as doctor and create healthcare note
    await loginAs('doctor');
    await page.goto('/patients/1/records');
    await page.click('button:has-text("Add Note")');
    await page.fill('[name="content"]', 'Healthcare note');
    await page.click('[value="healthcare"]');
    await page.click('button:has-text("Save")');
    
    // Login as nurse and verify note visible
    await loginAs('nurse');
    await page.goto('/patients/1/records');
    await expect(page.locator('text=Healthcare note')).toBeVisible();
  });

  test('all note visible to patients', async ({ loginAs, page }) => {
    // Login as doctor and create public note
    await loginAs('doctor');
    await page.goto('/patients/1/records');
    await page.click('button:has-text("Add Note")');
    await page.fill('[name="content"]', 'Public note');
    await page.click('[value="all"]');
    await page.click('button:has-text("Save")');
    
    // Login as patient and verify note visible
    await loginAs('patient');
    await page.goto('/my-records');
    await expect(page.locator('text=Public note')).toBeVisible();
  });
});
```

### CI/CD Integration

```yaml
# Add to .github/workflows/pr-validation.yml
e2e-tests:
  name: E2E Tests
  runs-on: ubuntu-latest
  needs: [build]
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '22'
        cache: 'npm'

    - name: Install dependencies
      working-directory: src/frontend
      run: npm ci

    - name: Install Playwright browsers
      working-directory: src/frontend
      run: npx playwright install --with-deps

    - name: Run E2E tests
      working-directory: src/frontend
      run: npx playwright test

    - name: Upload test report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: src/frontend/playwright-report/
        retention-days: 30
```

## Tasks

- [ ] Install Playwright and configure
- [ ] Write the login-entry smoke test before implementing the login screen
- [ ] Make the smoke test green as the first executable scaffold check
- [ ] Create test fixtures for authentication
- [ ] Write login/logout tests
- [ ] Write patient search tests
- [ ] Write patient view tests (role-based)
- [ ] Write medical record tests
- [ ] Write note creation tests
- [ ] Write note visibility tests
- [ ] Write access log tests
- [ ] Write blockchain verification tests
- [ ] Add E2E tests to CI/CD pipeline
- [ ] Create test data seeding script
- [ ] Document test procedures

## Done Criteria

- [ ] Playwright is configured and working
- [ ] All critical paths have E2E tests
- [ ] Tests run for all 5 user roles
- [ ] Note visibility is thoroughly tested
- [ ] Real-time updates are tested
- [ ] Tests run in CI/CD pipeline
- [ ] Test reports are generated
- [ ] Flaky tests are identified and fixed

## Notes

- Use Playwright Codegen to record tests: `npx playwright codegen`
- Use fixtures for common setup (login, test data)
- Use page object model for complex pages
- Run tests in parallel for speed
- Use traces for debugging failures

## Questions to Resolve

- [ ] How to handle test data seeding?
- [ ] Should we test on multiple browsers?
- [ ] How to handle real-time test assertions?
- [ ] Should we mock API calls or use real backend?
