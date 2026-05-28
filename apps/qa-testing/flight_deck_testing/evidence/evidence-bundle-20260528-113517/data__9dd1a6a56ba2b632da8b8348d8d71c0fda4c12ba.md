# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.js >> Study Portfolio Dashboard >> table toggle shows table with all required columns
- Location: tests\dashboard.spec.js:120:3

# Error details

```
TimeoutError: locator.fill: Timeout 15000ms exceeded.
Call log:
  - waiting for getByLabel(/username|email/i).first()

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - heading "Error 1033" [level=1] [ref=e5]
    - generic [ref=e6]: "Ray ID: a02e4f1576dcff80 •"
    - generic [ref=e7]: 2026-05-28 15:31:53 UTC
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
      - strong [ref=e28]: a02e4f1576dcff80
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
> 13  |   await page.getByLabel(/username|email/i).first().fill(VALID_USERNAME);
      |                                                    ^ TimeoutError: locator.fill: Timeout 15000ms exceeded.
  14  |   await page.getByLabel(/password/i).first().fill(VALID_PASSWORD);
  15  |   await page.getByRole('button', { name: /sign in|log in|login/i }).first().click();
  16  |   await page.waitForLoadState('networkidle').catch(() => {});
  17  | 
  18  |   // Verify login success by checking for dashboard heading
  19  |   const DASHBOARD_HEADING = /Study Portfolio Dashboard|Portfolio Dashboard|Flight Deck/i;
  20  |   const loggedIn = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
  21  |   if (!loggedIn) {
  22  |     // Output debug info
  23  |     const url = page.url();
  24  |     const body = await page.locator('body').innerText().catch(() => '');
  25  |     // eslint-disable-next-line no-console
  26  |     console.log('[LOGIN FAILURE] Not redirected to dashboard. URL:', url, '\nBody:', body.slice(0, 500));
  27  |     throw new Error('Login failed: Dashboard not visible after login.');
  28  |   }
  29  | }
  30  | 
  31  | test.describe('Study Portfolio Dashboard', () => {
  32  |   test.describe.configure({ mode: 'serial', timeout: 90_000 });
  33  | 
  34  | 
  35  | 
  36  | 
  37  | 
  38  |   let context;
  39  |   let page;
  40  | 
  41  |   test.beforeAll(async ({ browser }) => {
  42  |     context = await browser.newContext();
  43  |     page = await context.newPage();
  44  |     await loginUser(page);
  45  |   });
  46  | 
  47  |   test.afterAll(async () => {
  48  |     await context.close();
  49  |   });
  50  | 
  51  |   const DASHBOARD_HEADING = /Study Portfolio Dashboard|Portfolio Dashboard/i;
  52  | 
  53  |   const navigateToDashboard = async () => {
  54  |     const hasDashboardOnCurrentPage = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
  55  |     if (hasDashboardOnCurrentPage) {
  56  |       return;
  57  |     }
  58  | 
  59  |     // Always use absolute URLs for demo stability
  60  |     await page.goto(BASE_URL + '/portfolio');
  61  |     await page.waitForLoadState('networkidle').catch(() => {});
  62  | 
  63  |     const hasDashboardOnPortfolioRoute = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
  64  |     if (hasDashboardOnPortfolioRoute) {
  65  |       return;
  66  |     }
  67  | 
  68  |     await page.goto(BASE_URL + '/');
  69  |     await page.waitForLoadState('networkidle').catch(() => {});
  70  | 
  71  |     const studyPortfolioLink = page.getByRole('link', { name: /Study Portfolio|Open Study Portfolio/i }).first();
  72  |     if (await studyPortfolioLink.isVisible().catch(() => false)) {
  73  |       await studyPortfolioLink.click();
  74  |       await page.waitForLoadState('networkidle').catch(() => {});
  75  |     }
  76  | 
  77  |     const hasDashboardAfterClick = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
  78  |     if (!hasDashboardAfterClick) {
  79  |       await page.goto(BASE_URL + '/portfolio');
  80  |       await page.waitForLoadState('networkidle').catch(() => {});
  81  |     }
  82  |   };
  83  | 
  84  |   const getDashboardUnavailableReason = async () => {
  85  |     await navigateToDashboard();
  86  | 
  87  |     const hasDashboard = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
  88  |     if (hasDashboard) {
  89  |       return null;
  90  |     }
  91  | 
  92  |     const bodyText = await page.locator('body').innerText().catch(() => '');
  93  |     const finalPath = new URL(page.url()).pathname;
  94  |     if (/^\/(|portfolio)$/i.test(finalPath) === false) {
  95  |       return `Dashboard UI unavailable: unexpected path ${finalPath}`;
  96  |     }
  97  | 
  98  |     if (/not found/i.test(bodyText)) {
  99  |       return 'Dashboard UI unavailable: route returned Not Found';
  100 |     }
  101 | 
  102 |     return 'Dashboard UI unavailable in current environment';
  103 |   };
  104 | 
  105 |   const openDashboard = async () => {
  106 |     await navigateToDashboard();
  107 |     await page.waitForLoadState('networkidle');
  108 |     await expect(page.getByRole('heading', { name: DASHBOARD_HEADING })).toBeVisible();
  109 |   };
  110 | 
  111 |   test.beforeAll(async ({ browser }) => {
  112 |     context = await browser.newContext();
  113 |     page = await context.newPage();
```