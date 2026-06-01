# SCOUT E2E Test Runner

## Prerequisites
- Node.js installed
- SCOUT frontend running on http://localhost:5173
- SCOUT backend running on http://localhost:5000
- Demo seed data loaded (`npm run seed:demo` from server/)

## One-time setup (run once)

```bash
cd scout19-05/e2e
npm install
npx playwright install chromium
```

## Run all 93 tests

```bash
npm test
```

## Run by feature area (faster, focused)

```bash
npm run test:auth          # TC-001 to TC-010  — Login & session (10 tests)
npm run test:rbac          # TC-011 to TC-017  — Role access (7 tests)
npm run test:dashboard     # TC-018 to TC-021  — Dashboard views (4 tests)
npm run test:alerts        # TC-022 to TC-029  — Submit Alert (8 tests)
npm run test:incidents     # TC-030 to TC-038, TC-079-TC-082 — Incidents page (14 tests)
npm run test:lifecycle     # TC-040 to TC-046  — Status changes (7 tests)
npm run test:api           # TC-047, TC-075-TC-078, TC-083-TC-084 — Raw API (6 tests)
npm run test:analytics     # TC-049 to TC-058, TC-085 — Analytics (11 tests)
npm run test:notifications # TC-059 to TC-070, TC-084 — Notifications (13 tests)
npm run test:setup         # TC-071 to TC-073  — Setup page (3 tests)
```

## Check step matching without running the browser

```bash
npm run test:dry
```

## View the HTML report after a run

Open `e2e/reports/cucumber-report.html` in your browser.

## What the output looks like

```
Feature: Authentication
  ✔ Company Admin logs in with valid credentials         (1.2s)
  ✔ School Admin logs in with valid credentials          (0.9s)
  ✗ Login fails with invalid credentials                 (0.4s)
    AssertionError: Expected to see "Invalid email or password."

93 scenarios (87 passed, 4 failed, 2 pending)
413 steps (390 passed, 14 failed, 9 pending)
```

## Optional: run headed (see the browser)

Add `PWHEADLESS=false` env var or edit `support/world.js` and change:
```js
browser = await chromium.launch({ headless: false });
```

## Notes on specific tests

- **API tests (TC-047, TC-077)** — Hit the backend directly with fetch(). No browser needed.
- **Email acknowledge tests (TC-067–TC-070)** — Require a real email token. Set `ACKNOWLEDGE_TOKEN=<token>` env var, otherwise these steps are skipped with a warning.
- **Seeded data tests** — Most tests rely on `npm run seed:demo` having been run. If the DB is empty, many assertions will fail with "no rows found".
