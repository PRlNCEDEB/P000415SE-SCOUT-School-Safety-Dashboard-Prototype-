# FinalHope E2E Test Suite

End-to-end test automation for FinalHope using Cucumber (Gherkin) + Playwright.

**119 scenarios** across **17 feature modules** covering authentication, role-based access, incident management, analytics, notifications, and data integrity.

## Quick Start

### Prerequisites
- **Node.js** v16+ (check: `node -v`)
- **Frontend**: Running on `http://localhost:5173`
- **Backend**: Running on `http://localhost:5000`
- **Database**: Seeded with demo data

### One-Time Setup

```bash
cd e2e
npm install
npx playwright install chromium
```

### Run All Tests

```bash
npm test
```

Expected: **110 test cases** (119 scenarios with data-driven variants)

---

## Run Tests by Feature

```bash
npm run test:auth              # Authentication (10 tests)
npm run test:rbac              # Role-Based Access Control (8 tests)
npm run test:dashboard         # Dashboard (4 tests)
npm run test:alerts            # Submit Alert (8 tests)
npm run test:incidents         # Incidents Page (11 tests)
npm run test:lifecycle         # Incident Lifecycle (7 tests)
npm run test:api               # API Endpoints (6 tests)
npm run test:analytics         # Analytics (12 tests)
npm run test:notifications     # Notifications (12 tests)
npm run test:setup             # Setup Page (6 tests)
npm run test:ux                # UX (1 test)
npm run test:overdue           # Overdue Flagging (5 tests)
npm run test:export            # CSV Export (4 tests)
npm run test:integrity         # Data Integrity (5 tests)
npm run test:full-lifecycle    # Full Lifecycle E2E (1 test)
npm run test:isolation         # School Data Isolation (6 tests)
npm run test:beta-setup        # Beta Setup (4 tests)
```

---

## Utility Commands

### Dry Run (Check Step Matching)
Validates all step definitions without opening a browser:
```bash
npm run test:dry
```

### View Test Reports
After a test run, open the HTML report:
```bash
open reports/cucumber-report.html
```

Or on Windows:
```bash
start reports/cucumber-report.html
```

---

## Test Output Example

```
Feature: Authentication
  ✔ Company Admin logs in with valid credentials          (1.2s)
  ✔ School Admin logs in with valid credentials           (0.9s)
  ✔ Staff logs in with valid credentials                  (0.8s)
  ✗ Login fails with invalid credentials                  (0.4s)
    AssertionError: Expected to see "Invalid email or password."

110 scenarios (106 passed, 4 failed)
543 steps (530 passed, 13 failed)
Total duration: 1m 23s
```

---

## Test Structure

```
e2e/
├── features/                    # Feature files (Gherkin syntax)
│   ├── 01_authentication.feature
│   ├── 02_rbac.feature
│   ├── 03_dashboard.feature
│   └── ... (17 feature files)
├── step_definitions/            # Step implementations
│   ├── auth.js
│   ├── ui.js
│   ├── api.js
│   └── ...
├── support/
│   └── world.js                # Test context & hooks
├── cucumber.js                  # Cucumber configuration
├── package.json                # Dependencies & scripts
└── reports/                     # Test results (generated)
    ├── cucumber-report.html
    └── cucumber-report.json
```

---

## Test Scenarios Summary

| Feature | Tests | Coverage |
|---------|-------|----------|
| Authentication | 10 | Login, logout, redirects, validation |
| RBAC | 8 | Role badges, navigation, access control |
| Dashboard | 4 | Admin view, staff view, incident tiles |
| Submit Alert | 8 | Form validation, required fields, types, priorities |
| Incidents | 11 | Filtering, sorting, search, status badges |
| Lifecycle | 7 | Status transitions, permissions, persistence |
| API | 6 | Health check, auth, CRUD, permissions |
| Analytics | 12 | Charts, summary cards, data refresh, scope |
| Notifications | 12 | Delivery status, filters, email content, acknowledgment |
| Setup | 6 | Config sections, thresholds, archiving |
| UX | 1 | No tooltips/onboarding across all roles |
| Overdue | 5 | Badge display, threshold config, dashboard updates |
| Export | 4 | CSV download, button state, role restrictions |
| Data Integrity | 5 | Cross-page consistency, count matching |
| Full Lifecycle | 1 | End-to-end incident journey (all 4 stages) |
| School Isolation | 6 | Multi-school data separation |
| Beta Setup | 4 | Beta-specific routing and persistence |

---

## Test Accounts (Demo Data)

### Company Admin
- **Email**: `admin@scout.edu`
- **Password**: `password123`
- **Access**: Setup page only

### School Admin (Beta School)
- **Email**: `schooladmin@school.edu`
- **Password**: `password123`
- **Access**: Dashboard, incidents, analytics, setup

### Staff (Beta School)
- **Email**: `staff@school.edu`
- **Password**: `password123`
- **Access**: Dashboard, submit alert, incidents

---

## Advanced Usage

### Run Tests in Headed Mode (See Browser)

Set the environment variable before running:

**macOS/Linux:**
```bash
PWHEADLESS=false npm test
```

**Windows (PowerShell):**
```powershell
$env:PWHEADLESS="false"; npm test
```

**Windows (Command Prompt):**
```cmd
set PWHEADLESS=false && npm test
```

### Run Single Test
```bash
npx cucumber-js features/01_authentication.feature
```

### Run Specific Scenario
```bash
npx cucumber-js features/01_authentication.feature --name "Company Admin logs in"
```

### Debug Mode
Add breakpoints in step definitions and run:
```bash
node --inspect-brk node_modules/.bin/cucumber-js
```

---

## Environment Setup

### Required Environment Variables

Create `.env` file in e2e root (optional, for custom settings):

```env
# Frontend and Backend URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# Test Data
TEST_TIMEOUT=30000

# Playwright
PWHEADLESS=true
```

---

## Troubleshooting

### "No rows found" / Data Not Found
**Cause**: Demo data not seeded
**Fix**:
```bash
cd ../server
npm run seed:demo
cd ../e2e
npm test
```

### Tests Timeout
**Cause**: Application slow or unresponsive
**Check**:
1. Frontend running: `http://localhost:5173`
2. Backend running: `http://localhost:5000`
3. Network latency

**Increase timeout** in `cucumber.js`:
```js
timeout: 60000  // 60 seconds
```

### Playwright Browser Not Installed
**Fix**:
```bash
npx playwright install chromium
```

### Steps Not Found
**Check**: Run dry-run to validate step definitions
```bash
npm run test:dry
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd e2e && npm install
      
      - name: Install Playwright
        run: npx playwright install chromium
      
      - name: Start services (required)
        run: |
          cd server && npm run seed:demo &
          cd client && npm run dev &
          sleep 10
      
      - name: Run E2E tests
        run: cd e2e && npm test
      
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: cucumber-report
          path: e2e/reports/
```

---

## Contributing

### Adding New Tests

1. **Create feature file** or add scenario to existing:
   ```gherkin
   Feature: New Feature
     Scenario: New Test Case
       Given precondition
       When action
       Then assertion
   ```

2. **Implement step definitions** in `step_definitions/`:
   ```javascript
   Given('precondition', async function() {
     // Implementation
   });
   ```

3. **Run and verify**:
   ```bash
   npm run test:dry
   npm test
   ```

### Naming Convention
- Feature files: `##_feature-name.feature`
- Tags: `@feature-tag` (lowercase, kebab-case)
- Test IDs: `SCRUM-##NN` (project-feature-number)

---

## Resources

- **Gherkin Syntax**: [cucumber.io/docs/gherkin](https://cucumber.io/docs/gherkin)
- **Playwright Docs**: [playwright.dev](https://playwright.dev)
- **Cucumber.js**: [github.com/cucumber/cucumber-js](https://github.com/cucumber/cucumber-js)

---

## Contact & Support

For issues or questions:
- Check existing test cases for patterns
- Review step definitions in `step_definitions/`
- Run dry-run to validate syntax
- Check `reports/cucumber-report.html` for detailed failure info

---

**Last Updated**: June 2026  
**Total Tests**: 110 test cases (119 scenarios)  
**Status**: Active & Maintained
