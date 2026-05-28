# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.js >> Study Portfolio Dashboard >> table toggle shows table with all required columns
- Location: tests\dashboard.spec.js:41:3

# Error details

```
Error: Login failed at https://spend-mhz-bufing-characteristics.trycloudflare.com/login :: Flight Deck
Clinical Trials Intelligence
Pilot every protocol
with precision

Flight Deck is the operating cockpit for clinical operations teams. Turn enrollment signals, site performance, and protocol risk into the decisions that move medicine forward — from first patient in to final readout.

Unif
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e4]:
      - link "Flight Deck" [ref=e5] [cursor=pointer]:
        - /url: /home
      - navigation [ref=e6]:
        - link "Home" [ref=e7] [cursor=pointer]:
          - /url: /home
          - img [ref=e8]
          - text: Home
        - link "Study Portfolio" [ref=e11] [cursor=pointer]:
          - /url: /portfolio
          - img [ref=e12]
          - text: Study Portfolio
        - link "Protocol Search" [ref=e17] [cursor=pointer]:
          - /url: /protocol-search
          - img [ref=e18]
          - text: Protocol Search
        - link "Configure" [ref=e21] [cursor=pointer]:
          - /url: /configure
          - img [ref=e22]
          - text: Configure
      - generic [ref=e25]:
        - generic [ref=e26]: VIEWER
        - generic [ref=e28]:
          - generic [ref=e29]: vi
          - generic [ref=e30]: Viewer User
        - button "Sign out" [ref=e31]:
          - img [ref=e32]
          - text: Sign out
  - main [ref=e35]:
    - generic [ref=e36]:
      - generic [ref=e37]:
        - img [ref=e38]
        - text: Flight Deck
      - heading "Welcome to Flight Deck" [level=1] [ref=e40]
      - paragraph [ref=e41]: The operating cockpit for clinical operations. Pick where you want to go next.
      - generic [ref=e42]:
        - link "Study Portfolio Browse every active and planned study with live enrollment, site coverage, and performance signals in one place. Open" [ref=e43] [cursor=pointer]:
          - /url: /portfolio
          - img [ref=e45]
          - heading "Study Portfolio" [level=2] [ref=e50]
          - paragraph [ref=e51]: Browse every active and planned study with live enrollment, site coverage, and performance signals in one place.
          - generic [ref=e52]:
            - text: Open
            - img [ref=e53]
        - link "Protocol Search Search across protocols to find precedents, eligibility patterns, and design intelligence for your next study. Open" [ref=e55] [cursor=pointer]:
          - /url: /protocol-search
          - img [ref=e57]
          - heading "Protocol Search" [level=2] [ref=e60]
          - paragraph [ref=e61]: Search across protocols to find precedents, eligibility patterns, and design intelligence for your next study.
          - generic [ref=e62]:
            - text: Open
            - img [ref=e63]
  - region "Notifications alt+T"
```

# Test source

```ts
  1   | const { expect } = require('@playwright/test');
  2   | 
  3   | const DEFAULT_BASE_URL = 'https://spend-mhz-bufing-characteristics.trycloudflare.com';
  4   | const DEFAULT_LOGIN_PATH = '/login';
  5   | const DEFAULT_PORTFOLIO_PATH = '/portfolio';
  6   | 
  7   | function getBaseUrl(baseUrl) {
  8   |   return String(baseUrl || process.env.TEST_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  9   | }
  10  | 
  11  | function getCredentials() {
  12  |   return {
  13  |     username: process.env.LOGIN_USERNAME || 'viewer',
  14  |     password: process.env.LOGIN_PASSWORD || 'eagle@123',
  15  |   };
  16  | }
  17  | 
  18  | async function fillIfVisible(locator, value) {
  19  |   if (await locator.isVisible().catch(() => false)) {
  20  |     await locator.fill(value);
  21  |     return true;
  22  |   }
  23  |   return false;
  24  | }
  25  | 
  26  | async function ensureLoggedIn(page, options = {}) {
  27  |   const baseUrl = getBaseUrl(options.baseUrl);
  28  |   const loginPath = options.loginPath || DEFAULT_LOGIN_PATH;
  29  |   const { username, password } = getCredentials();
  30  | 
  31  |   await page.goto(`${baseUrl}${loginPath}`, { waitUntil: 'domcontentloaded' });
  32  |   await page.waitForLoadState('networkidle').catch(() => {});
  33  | 
  34  |   const usernameInput = page
  35  |     .getByLabel(/username|email/i)
  36  |     .or(page.getByPlaceholder(/enter your username|username|email/i))
  37  |     .or(page.locator('input[name*="user" i], input[name*="email" i], input[type="email"], input[type="text"]').first())
  38  |     .first();
  39  | 
  40  |   const passwordInput = page
  41  |     .getByLabel(/password/i)
  42  |     .or(page.getByPlaceholder(/password/i))
  43  |     .or(page.locator('input[type="password"], input[name*="pass" i]').first())
  44  |     .first();
  45  | 
  46  |   const signInButton = page
  47  |     .getByRole('button', { name: /sign in|log in|login/i })
  48  |     .or(page.locator('button[type="submit"]').first())
  49  |     .first();
  50  | 
  51  |   await expect(usernameInput).toBeVisible();
  52  |   await expect(passwordInput).toBeVisible();
  53  |   await expect(signInButton).toBeVisible();
  54  | 
  55  |   await usernameInput.fill(username);
  56  |   await passwordInput.fill(password);
  57  |   await signInButton.click();
  58  | 
  59  |   await page.waitForLoadState('networkidle').catch(() => {});
  60  | 
  61  |   const stillOnLogin = /\/login\/?$/i.test(new URL(page.url()).pathname);
  62  |   const authError = page
  63  |     .getByText(/invalid|incorrect|failed|unauthorized|try again|not match|wrong credentials/i)
  64  |     .first();
  65  | 
  66  |   if (stillOnLogin || (await authError.isVisible().catch(() => false))) {
  67  |     const body = await page.locator('body').innerText().catch(() => '');
> 68  |     throw new Error(`Login failed at ${page.url()} :: ${body.slice(0, 300)}`);
      |           ^ Error: Login failed at https://spend-mhz-bufing-characteristics.trycloudflare.com/login :: Flight Deck
  69  |   }
  70  | 
  71  |   const loggedInAnchor = page
  72  |     .getByRole('button', { name: /sign out/i })
  73  |     .or(page.getByRole('link', { name: /Study Portfolio|Protocol Search|Home/i }))
  74  |     .first();
  75  | 
  76  |   await expect(loggedInAnchor).toBeVisible();
  77  | }
  78  | 
  79  | async function openStudyPortfolio(page, options = {}) {
  80  |   const baseUrl = getBaseUrl(options.baseUrl);
  81  |   const portfolioPath = options.portfolioPath || DEFAULT_PORTFOLIO_PATH;
  82  | 
  83  |   const studyPortfolioLink = page.getByRole('link', { name: /Study Portfolio/i }).first();
  84  | 
  85  |   if (await studyPortfolioLink.isVisible().catch(() => false)) {
  86  |     await studyPortfolioLink.click({ force: true });
  87  |     await page.waitForLoadState('networkidle').catch(() => {});
  88  |   } else {
  89  |     await page.goto(`${baseUrl}${portfolioPath}`, { waitUntil: 'domcontentloaded' });
  90  |     await page.waitForLoadState('networkidle').catch(() => {});
  91  |   }
  92  | 
  93  |   if (!/\/portfolio\/?$/i.test(new URL(page.url()).pathname)) {
  94  |     await page.goto(`${baseUrl}${portfolioPath}`, { waitUntil: 'domcontentloaded' });
  95  |     await page.waitForLoadState('networkidle').catch(() => {});
  96  |   }
  97  | 
  98  |   await expect(page).toHaveURL(/\/portfolio\/?$/i);
  99  |   await expect(page.getByRole('heading', { name: /Study Portfolio Dashboard|Portfolio Dashboard/i })).toBeVisible();
  100 | }
  101 | 
  102 | async function setupAuthenticatedStudyPortfolio(page, options = {}) {
  103 |   await ensureLoggedIn(page, options);
  104 |   await openStudyPortfolio(page, options);
  105 | }
  106 | 
  107 | module.exports = {
  108 |   ensureLoggedIn,
  109 |   openStudyPortfolio,
  110 |   setupAuthenticatedStudyPortfolio,
  111 | };
  112 | 
```