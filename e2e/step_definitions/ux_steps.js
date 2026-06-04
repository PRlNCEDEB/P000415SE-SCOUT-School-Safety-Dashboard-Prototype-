const { Given, When, Then } = require('@cucumber/cucumber');

// Company Admin can ONLY access /setup (NotCompanyAdminRoute blocks all others)
// School Admin and Staff have their own accessible pages
const ALL_ROLE_PAGES = {
  'Company Admin': ['/setup'],
  'School Admin':  ['/dashboard', '/submit', '/incidents', '/analytics', '/notifications', '/setup'],
  'Staff':         ['/dashboard', '/submit', '/incidents'],
};

Given('I log in as each of the three roles', async function () {
  this.rolesToCheck = Object.keys(ALL_ROLE_PAGES);
});

When('I navigate through all accessible pages for each role', async function () {
  this.uxErrors = [];

  for (const role of this.rolesToCheck) {
    await this.login(role);

    for (const path of ALL_ROLE_PAGES[role]) {
      await this.page.goto(`${this.baseUrl}${path}`);
      await this.page.waitForLoadState('networkidle');

      const tooltipSelectors = [
        // Exclude recharts-* — Recharts charts use class names containing "tooltip"
        // for their built-in chart tooltip components. These are NOT onboarding overlays.
        '[class*="tooltip"]:not([class*="recharts"])',
        '[class*="popover"]',
        '[class*="onboarding"]',
        '[class*="guided-tour"]',
        '[class*="tour"]',
        '[class*="walkthrough"]',
        '[class*="help-overlay"]',
        '[role="tooltip"]',
        '[data-tour]',
        '[data-step]',
      ];

      for (const sel of tooltipSelectors) {
        const count = await this.page.locator(sel).count();
        if (count > 0) {
          this.uxErrors.push(`Found "${sel}" on ${path} as ${role}`);
        }
      }
    }
  }
});

Then('I do not see any tooltips, popovers, onboarding flows, guided tours, or help overlays on any page', async function () {
  if (this.uxErrors && this.uxErrors.length > 0) {
    throw new Error(`UX overlay elements found:\n${this.uxErrors.join('\n')}`);
  }
});
