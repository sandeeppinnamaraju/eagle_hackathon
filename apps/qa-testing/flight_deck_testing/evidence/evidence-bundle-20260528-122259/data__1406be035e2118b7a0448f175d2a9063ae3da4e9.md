# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.js >> Study Portfolio Dashboard >> table toggle shows table with all required columns
- Location: tests\dashboard.spec.js:149:3

# Error details

```
Error: Login failed: Username/email input not found.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - heading "Error 1033" [level=1] [ref=e5]
    - generic [ref=e6]: "Ray ID: a02e53f1152dd6e0 •"
    - generic [ref=e7]: 2026-05-28 15:35:12 UTC
    - heading "Cloudflare Tunnel error" [level=2] [ref=e8]
  - generic [ref=e9]:
    - generic [ref=e10]:
      - heading "What happened?" [level=2] [ref=e11]
      - paragraph [ref=e12]:
        - text: You've requested a page on a website (sip-cottage-hair-outdoors.trycloudflare.com) that is on the
        - link "Cloudflare" [ref=e13] [cursor=pointer]:
          - /url: https://www.cloudflare.com/5xx-error-landing/
        - text: network. The host (sip-cottage-hair-outdoors.trycloudflare.com) is configured as a Cloudflare Tunnel, and Cloudflare is currently unable to resolve it.
    - generic [ref=e14]:
      - heading "What can I do?" [level=2] [ref=e15]
      - paragraph [ref=e16]:
        - strong [ref=e17]: "If you are a visitor of this website:"
        - text: Please try again in a few minutes.
      - paragraph [ref=e18]:
        - strong [ref=e19]: "If you are the owner of this website:"
        - text: Ensure that cloudflared is running and can reach the network. You may wish to enable
        - link "load balancing" [ref=e20] [cursor=pointer]:
          - /url: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/routing-to-tunnel/lb/
        - text: for your tunnel.
  - generic [ref=e22]:
    - text: Was this page helpful?
    - button "Yes" [ref=e23] [cursor=pointer]
    - button "No" [ref=e24] [cursor=pointer]
  - paragraph [ref=e26]:
    - generic [ref=e27]:
      - text: "Cloudflare Ray ID:"
      - strong [ref=e28]: a02e53f1152dd6e0
    - text: •
    - generic [ref=e29]:
      - text: "Your IP:"
      - button "Click to reveal" [ref=e30] [cursor=pointer]
      - text: •
    - generic [ref=e31]:
      - text: Performance & security by
      - link "Cloudflare" [ref=e32] [cursor=pointer]:
        - /url: https://www.cloudflare.com/5xx-error-landing
```

# Test source

```ts
  1   | 
  2   | const { test, expect } = require('../utils/stepTest');
  3   | const { EXPECTED_COLUMNS } = require('../fixtures/dashboardData');
  4   | 
  5   | // Hardcoded for this test file only
  6   | const BASE_URL = 'https://sip-cottage-hair-outdoors.trycloudflare.com';
  7   | const LOGIN_PATH = '/login';
  8   | const VALID_USERNAME = 'viewer';
  9   | const VALID_PASSWORD = 'eagle@123';
  10  | 
  11  | async function loginUser(page) {
  12  |   await page.goto(`${BASE_URL}${LOGIN_PATH}`, { waitUntil: 'domcontentloaded' });
  13  | 
  14  |   // Try multiple selectors for username/email
  15  |   let usernameInput = page.locator('input[name*="user" i], input[name*="email" i], input[type="email"], input[type="text"]').first();
  16  |   if (!(await usernameInput.isVisible().catch(() => false))) {
  17  |     // Output debug info
  18  |     const url = page.url();
  19  |     const body = await page.locator('body').innerText().catch(() => '');
  20  |     console.log('[LOGIN FAILURE] Username/email input not found. URL:', url, '\nBody:', body.slice(0, 500));
> 21  |     throw new Error('Login failed: Username/email input not found.');
      |           ^ Error: Login failed: Username/email input not found.
  22  |   }
  23  |   await usernameInput.fill(VALID_USERNAME);
  24  | 
  25  |   // Try multiple selectors for password
  26  |   let passwordInput = page.locator('input[type="password"], input[name*="pass" i]').first();
  27  |   if (!(await passwordInput.isVisible().catch(() => false))) {
  28  |     const url = page.url();
  29  |     const body = await page.locator('body').innerText().catch(() => '');
  30  |     console.log('[LOGIN FAILURE] Password input not found. URL:', url, '\nBody:', body.slice(0, 500));
  31  |     throw new Error('Login failed: Password input not found.');
  32  |   }
  33  |   await passwordInput.fill(VALID_PASSWORD);
  34  | 
  35  |   // Try multiple selectors for sign in button
  36  |   let signInButton = page.getByRole('button', { name: /sign in|log in|login/i }).first();
  37  |   if (!(await signInButton.isVisible().catch(() => false))) {
  38  |     signInButton = page.locator('button[type="submit"]').first();
  39  |   }
  40  |   if (!(await signInButton.isVisible().catch(() => false))) {
  41  |     const url = page.url();
  42  |     const body = await page.locator('body').innerText().catch(() => '');
  43  |     console.log('[LOGIN FAILURE] Sign in button not found. URL:', url, '\nBody:', body.slice(0, 500));
  44  |     throw new Error('Login failed: Sign in button not found.');
  45  |   }
  46  |   await signInButton.click();
  47  |   await page.waitForLoadState('networkidle').catch(() => {});
  48  | 
  49  |   // Verify login success by checking for dashboard heading
  50  |   const DASHBOARD_HEADING = /Study Portfolio Dashboard|Portfolio Dashboard|Flight Deck/i;
  51  |   const loggedIn = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
  52  |   if (!loggedIn) {
  53  |     const url = page.url();
  54  |     const body = await page.locator('body').innerText().catch(() => '');
  55  |     console.log('[LOGIN FAILURE] Not redirected to dashboard. URL:', url, '\nBody:', body.slice(0, 500));
  56  |     throw new Error('Login failed: Dashboard not visible after login.');
  57  |   }
  58  | }
  59  | 
  60  | test.describe('Study Portfolio Dashboard', () => {
  61  |   test.describe.configure({ mode: 'serial', timeout: 90_000 });
  62  | 
  63  | 
  64  | 
  65  | 
  66  | 
  67  |   let context;
  68  |   let page;
  69  | 
  70  |   test.beforeAll(async ({ browser }) => {
  71  |     context = await browser.newContext();
  72  |     page = await context.newPage();
  73  |     await loginUser(page);
  74  |   });
  75  | 
  76  |   test.afterAll(async () => {
  77  |     await context.close();
  78  |   });
  79  | 
  80  |   const DASHBOARD_HEADING = /Study Portfolio Dashboard|Portfolio Dashboard/i;
  81  | 
  82  |   const navigateToDashboard = async () => {
  83  |     const hasDashboardOnCurrentPage = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
  84  |     if (hasDashboardOnCurrentPage) {
  85  |       return;
  86  |     }
  87  | 
  88  |     // Always use absolute URLs for demo stability
  89  |     await page.goto(BASE_URL + '/portfolio');
  90  |     await page.waitForLoadState('networkidle').catch(() => {});
  91  | 
  92  |     const hasDashboardOnPortfolioRoute = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
  93  |     if (hasDashboardOnPortfolioRoute) {
  94  |       return;
  95  |     }
  96  | 
  97  |     await page.goto(BASE_URL + '/');
  98  |     await page.waitForLoadState('networkidle').catch(() => {});
  99  | 
  100 |     const studyPortfolioLink = page.getByRole('link', { name: /Study Portfolio|Open Study Portfolio/i }).first();
  101 |     if (await studyPortfolioLink.isVisible().catch(() => false)) {
  102 |       await studyPortfolioLink.click();
  103 |       await page.waitForLoadState('networkidle').catch(() => {});
  104 |     }
  105 | 
  106 |     const hasDashboardAfterClick = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
  107 |     if (!hasDashboardAfterClick) {
  108 |       await page.goto(BASE_URL + '/portfolio');
  109 |       await page.waitForLoadState('networkidle').catch(() => {});
  110 |     }
  111 |   };
  112 | 
  113 |   const getDashboardUnavailableReason = async () => {
  114 |     await navigateToDashboard();
  115 | 
  116 |     const hasDashboard = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
  117 |     if (hasDashboard) {
  118 |       return null;
  119 |     }
  120 | 
  121 |     const bodyText = await page.locator('body').innerText().catch(() => '');
```