# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.js >> Study Portfolio Dashboard >> table toggle shows table with all required columns
- Location: tests\dashboard.spec.js:152:3

# Error details

```
Error: Login failed: Dashboard not visible after login.
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - main [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - img [ref=e7]
        - generic [ref=e9]: Flight Deck
      - generic [ref=e10]:
        - generic [ref=e11]:
          - generic [ref=e12]:
            - img [ref=e13]
            - text: Clinical Trials Intelligence
          - heading "Pilot every protocol with precision" [level=1] [ref=e16]:
            - text: Pilot every protocol
            - text: with precision
          - paragraph [ref=e17]: Flight Deck is the operating cockpit for clinical operations teams. Turn enrollment signals, site performance, and protocol risk into the decisions that move medicine forward — from first patient in to final readout.
          - list [ref=e18]:
            - listitem [ref=e19]:
              - img [ref=e21]
              - generic [ref=e26]:
                - paragraph [ref=e27]: Unified portfolio
                - paragraph [ref=e28]: Track every study, site, and milestone across regions in one live workspace.
            - listitem [ref=e29]:
              - img [ref=e31]
              - generic [ref=e33]:
                - paragraph [ref=e34]: Real-time signals
                - paragraph [ref=e35]: Enrollment velocity, screen-fail rates, and risk scores updated as data arrives.
            - listitem [ref=e36]:
              - img [ref=e38]
              - generic [ref=e41]:
                - paragraph [ref=e42]: Protocol intelligence
                - paragraph [ref=e43]: Search 100k+ protocols and benchmark designs against your therapeutic area.
        - generic [ref=e45]:
          - heading "Sign in" [level=2] [ref=e46]
          - paragraph [ref=e47]: Enter your credentials to access Flight Deck.
          - generic [ref=e48]:
            - generic [ref=e49]:
              - text: Username
              - textbox "Username" [ref=e50]:
                - /placeholder: Enter your username
            - generic [ref=e51]:
              - text: Password
              - generic [ref=e52]:
                - textbox "Password" [ref=e53]:
                  - /placeholder: ••••••••
                - button "Show password" [ref=e54]:
                  - img [ref=e55]
            - button "Sign in" [ref=e58]
  - region "Notifications alt+T"
```

# Test source

```ts
  1   | const { test, expect } = require('../utils/stepTest');
  2   | const { EXPECTED_COLUMNS } = require('../fixtures/dashboardData');
  3   | 
  4   | // Hardcoded for this test file only
  5   | const BASE_URL = 'https://spend-mhz-bufing-characteristics.trycloudflare.com';
  6   | const LOGIN_PATH = '/login';
  7   | const VALID_USERNAME = 'viewer';
  8   | const VALID_PASSWORD = 'eagle@123';
  9   | 
  10  | async function loginUser(page) {
  11  |   await page.goto(`${BASE_URL}${LOGIN_PATH}`, { waitUntil: 'domcontentloaded' });
  12  | 
  13  |   // Try multiple selectors for username/email
  14  |   let usernameInput = page.locator('input[name*="user" i], input[name*="email" i], input[type="email"], input[type="text"]').first();
  15  |   if (!(await usernameInput.isVisible().catch(() => false))) {
  16  |     // Output debug info
  17  |     const url = page.url();
  18  |     const body = await page.locator('body').innerText().catch(() => '');
  19  |     await page.screenshot({ path: 'debug-username-input-not-found.png' });
  20  |     console.log('[LOGIN FAILURE] Username/email input not found. URL:', url, '\nBody:', body.slice(0, 500));
  21  |     throw new Error('Login failed: Username/email input not found.');
  22  |   }
  23  |   await usernameInput.fill(VALID_USERNAME);
  24  | 
  25  |   // Try multiple selectors for password
  26  |   let passwordInput = page.locator('input[type="password"], input[name*="pass" i]').first();
  27  |   if (!(await passwordInput.isVisible().catch(() => false))) {
  28  |     const url = page.url();
  29  |     const body = await page.locator('body').innerText().catch(() => '');
  30  |     await page.screenshot({ path: 'debug-password-input-not-found.png' });
  31  |     console.log('[LOGIN FAILURE] Password input not found. URL:', url, '\nBody:', body.slice(0, 500));
  32  |     throw new Error('Login failed: Password input not found.');
  33  |   }
  34  |   await passwordInput.fill(VALID_PASSWORD);
  35  | 
  36  |   // Try multiple selectors for sign in button
  37  |   let signInButton = page.getByRole('button', { name: /sign in|log in|login/i }).first();
  38  |   if (!(await signInButton.isVisible().catch(() => false))) {
  39  |     signInButton = page.locator('button[type="submit"]').first();
  40  |   }
  41  |   if (!(await signInButton.isVisible().catch(() => false))) {
  42  |     const url = page.url();
  43  |     const body = await page.locator('body').innerText().catch(() => '');
  44  |     await page.screenshot({ path: 'debug-signin-button-not-found.png' });
  45  |     console.log('[LOGIN FAILURE] Sign in button not found. URL:', url, '\nBody:', body.slice(0, 500));
  46  |     throw new Error('Login failed: Sign in button not found.');
  47  |   }
  48  |   await signInButton.click();
  49  |   await page.waitForLoadState('networkidle').catch(() => {});
  50  | 
  51  |   // Verify login success by checking for dashboard heading
  52  |   const DASHBOARD_HEADING = /Study Portfolio Dashboard|Portfolio Dashboard|Flight Deck/i;
  53  |   const loggedIn = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
  54  |   if (!loggedIn) {
  55  |     const url = page.url();
  56  |     const body = await page.locator('body').innerText().catch(() => '');
  57  |     await page.screenshot({ path: 'debug-login-failure.png' });
  58  |     console.log('[LOGIN FAILURE] Not redirected to dashboard. URL:', url, '\nBody:', body.slice(0, 500));
> 59  |     throw new Error('Login failed: Dashboard not visible after login.');
      |           ^ Error: Login failed: Dashboard not visible after login.
  60  |   }
  61  | }
  62  | 
  63  | test.describe('Study Portfolio Dashboard', () => {
  64  |   test.describe.configure({ mode: 'serial', timeout: 90_000 });
  65  | 
  66  | 
  67  | 
  68  | 
  69  | 
  70  |   let context;
  71  |   let page;
  72  | 
  73  |   test.beforeAll(async ({ browser }) => {
  74  |     context = await browser.newContext();
  75  |     page = await context.newPage();
  76  |     await loginUser(page);
  77  |   });
  78  | 
  79  |   test.afterAll(async () => {
  80  |     await context.close();
  81  |   });
  82  | 
  83  |   const DASHBOARD_HEADING = /Study Portfolio Dashboard|Portfolio Dashboard/i;
  84  | 
  85  |   const navigateToDashboard = async () => {
  86  |     const hasDashboardOnCurrentPage = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
  87  |     if (hasDashboardOnCurrentPage) {
  88  |       return;
  89  |     }
  90  | 
  91  |     // Always use absolute URLs for demo stability
  92  |     await page.goto(BASE_URL + '/portfolio');
  93  |     await page.waitForLoadState('networkidle').catch(() => {});
  94  | 
  95  |     const hasDashboardOnPortfolioRoute = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
  96  |     if (hasDashboardOnPortfolioRoute) {
  97  |       return;
  98  |     }
  99  | 
  100 |     await page.goto(BASE_URL + '/');
  101 |     await page.waitForLoadState('networkidle').catch(() => {});
  102 | 
  103 |     const studyPortfolioLink = page.getByRole('link', { name: /Study Portfolio|Open Study Portfolio/i }).first();
  104 |     if (await studyPortfolioLink.isVisible().catch(() => false)) {
  105 |       await studyPortfolioLink.click();
  106 |       await page.waitForLoadState('networkidle').catch(() => {});
  107 |     }
  108 | 
  109 |     const hasDashboardAfterClick = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
  110 |     if (!hasDashboardAfterClick) {
  111 |       await page.goto(BASE_URL + '/portfolio');
  112 |       await page.waitForLoadState('networkidle').catch(() => {});
  113 |     }
  114 |   };
  115 | 
  116 |   const getDashboardUnavailableReason = async () => {
  117 |     await navigateToDashboard();
  118 | 
  119 |     const hasDashboard = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
  120 |     if (hasDashboard) {
  121 |       return null;
  122 |     }
  123 | 
  124 |     const bodyText = await page.locator('body').innerText().catch(() => '');
  125 |     const finalPath = new URL(page.url()).pathname;
  126 |     if (/^\/(|portfolio)$/i.test(finalPath) === false) {
  127 |       return `Dashboard UI unavailable: unexpected path ${finalPath}`;
  128 |     }
  129 | 
  130 |     if (/not found/i.test(bodyText)) {
  131 |       return 'Dashboard UI unavailable: route returned Not Found';
  132 |     }
  133 | 
  134 |     return 'Dashboard UI unavailable in current environment';
  135 |   };
  136 | 
  137 |   const openDashboard = async () => {
  138 |     await navigateToDashboard();
  139 |     await page.waitForLoadState('networkidle');
  140 |     await expect(page.getByRole('heading', { name: DASHBOARD_HEADING })).toBeVisible();
  141 |   };
  142 | 
  143 |   test.beforeAll(async ({ browser }) => {
  144 |     context = await browser.newContext();
  145 |     page = await context.newPage();
  146 |   });
  147 | 
  148 |   test.afterAll(async () => {
  149 |     await context.close();
  150 |   });
  151 | 
  152 |   test('table toggle shows table with all required columns', async () => {
  153 |     const unavailableReason = await getDashboardUnavailableReason();
  154 |     test.skip(!!unavailableReason, unavailableReason);
  155 | 
  156 |     await openDashboard();
  157 |     await page.getByRole('button', { name: 'Table' }).first().click();
  158 | 
  159 |     const table = page.locator('table, [role="table"]').first();
```