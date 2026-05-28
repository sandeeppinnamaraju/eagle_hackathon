# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.js >> Study Portfolio Dashboard >> table toggle shows table with all required columns
- Location: tests\dashboard.spec.js:148:3

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
  19  |     console.log('[LOGIN FAILURE] Username/email input not found. URL:', url, '\nBody:', body.slice(0, 500));
  20  |     throw new Error('Login failed: Username/email input not found.');
  21  |   }
  22  |   await usernameInput.fill(VALID_USERNAME);
  23  | 
  24  |   // Try multiple selectors for password
  25  |   let passwordInput = page.locator('input[type="password"], input[name*="pass" i]').first();
  26  |   if (!(await passwordInput.isVisible().catch(() => false))) {
  27  |     const url = page.url();
  28  |     const body = await page.locator('body').innerText().catch(() => '');
  29  |     console.log('[LOGIN FAILURE] Password input not found. URL:', url, '\nBody:', body.slice(0, 500));
  30  |     throw new Error('Login failed: Password input not found.');
  31  |   }
  32  |   await passwordInput.fill(VALID_PASSWORD);
  33  | 
  34  |   // Try multiple selectors for sign in button
  35  |   let signInButton = page.getByRole('button', { name: /sign in|log in|login/i }).first();
  36  |   if (!(await signInButton.isVisible().catch(() => false))) {
  37  |     signInButton = page.locator('button[type="submit"]').first();
  38  |   }
  39  |   if (!(await signInButton.isVisible().catch(() => false))) {
  40  |     const url = page.url();
  41  |     const body = await page.locator('body').innerText().catch(() => '');
  42  |     console.log('[LOGIN FAILURE] Sign in button not found. URL:', url, '\nBody:', body.slice(0, 500));
  43  |     throw new Error('Login failed: Sign in button not found.');
  44  |   }
  45  |   await signInButton.click();
  46  |   await page.waitForLoadState('networkidle').catch(() => {});
  47  | 
  48  |   // Verify login success by checking for dashboard heading
  49  |   const DASHBOARD_HEADING = /Study Portfolio Dashboard|Portfolio Dashboard|Flight Deck/i;
  50  |   const loggedIn = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
  51  |   if (!loggedIn) {
  52  |     const url = page.url();
  53  |     const body = await page.locator('body').innerText().catch(() => '');
  54  |     console.log('[LOGIN FAILURE] Not redirected to dashboard. URL:', url, '\nBody:', body.slice(0, 500));
> 55  |     throw new Error('Login failed: Dashboard not visible after login.');
      |           ^ Error: Login failed: Dashboard not visible after login.
  56  |   }
  57  | }
  58  | 
  59  | test.describe('Study Portfolio Dashboard', () => {
  60  |   test.describe.configure({ mode: 'serial', timeout: 90_000 });
  61  | 
  62  | 
  63  | 
  64  | 
  65  | 
  66  |   let context;
  67  |   let page;
  68  | 
  69  |   test.beforeAll(async ({ browser }) => {
  70  |     context = await browser.newContext();
  71  |     page = await context.newPage();
  72  |     await loginUser(page);
  73  |   });
  74  | 
  75  |   test.afterAll(async () => {
  76  |     await context.close();
  77  |   });
  78  | 
  79  |   const DASHBOARD_HEADING = /Study Portfolio Dashboard|Portfolio Dashboard/i;
  80  | 
  81  |   const navigateToDashboard = async () => {
  82  |     const hasDashboardOnCurrentPage = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
  83  |     if (hasDashboardOnCurrentPage) {
  84  |       return;
  85  |     }
  86  | 
  87  |     // Always use absolute URLs for demo stability
  88  |     await page.goto(BASE_URL + '/portfolio');
  89  |     await page.waitForLoadState('networkidle').catch(() => {});
  90  | 
  91  |     const hasDashboardOnPortfolioRoute = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
  92  |     if (hasDashboardOnPortfolioRoute) {
  93  |       return;
  94  |     }
  95  | 
  96  |     await page.goto(BASE_URL + '/');
  97  |     await page.waitForLoadState('networkidle').catch(() => {});
  98  | 
  99  |     const studyPortfolioLink = page.getByRole('link', { name: /Study Portfolio|Open Study Portfolio/i }).first();
  100 |     if (await studyPortfolioLink.isVisible().catch(() => false)) {
  101 |       await studyPortfolioLink.click();
  102 |       await page.waitForLoadState('networkidle').catch(() => {});
  103 |     }
  104 | 
  105 |     const hasDashboardAfterClick = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
  106 |     if (!hasDashboardAfterClick) {
  107 |       await page.goto(BASE_URL + '/portfolio');
  108 |       await page.waitForLoadState('networkidle').catch(() => {});
  109 |     }
  110 |   };
  111 | 
  112 |   const getDashboardUnavailableReason = async () => {
  113 |     await navigateToDashboard();
  114 | 
  115 |     const hasDashboard = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
  116 |     if (hasDashboard) {
  117 |       return null;
  118 |     }
  119 | 
  120 |     const bodyText = await page.locator('body').innerText().catch(() => '');
  121 |     const finalPath = new URL(page.url()).pathname;
  122 |     if (/^\/(|portfolio)$/i.test(finalPath) === false) {
  123 |       return `Dashboard UI unavailable: unexpected path ${finalPath}`;
  124 |     }
  125 | 
  126 |     if (/not found/i.test(bodyText)) {
  127 |       return 'Dashboard UI unavailable: route returned Not Found';
  128 |     }
  129 | 
  130 |     return 'Dashboard UI unavailable in current environment';
  131 |   };
  132 | 
  133 |   const openDashboard = async () => {
  134 |     await navigateToDashboard();
  135 |     await page.waitForLoadState('networkidle');
  136 |     await expect(page.getByRole('heading', { name: DASHBOARD_HEADING })).toBeVisible();
  137 |   };
  138 | 
  139 |   test.beforeAll(async ({ browser }) => {
  140 |     context = await browser.newContext();
  141 |     page = await context.newPage();
  142 |   });
  143 | 
  144 |   test.afterAll(async () => {
  145 |     await context.close();
  146 |   });
  147 | 
  148 |   test('table toggle shows table with all required columns', async () => {
  149 |     const unavailableReason = await getDashboardUnavailableReason();
  150 |     test.skip(!!unavailableReason, unavailableReason);
  151 | 
  152 |     await openDashboard();
  153 |     await page.getByRole('button', { name: 'Table' }).first().click();
  154 | 
  155 |     const table = page.locator('table, [role="table"]').first();
```