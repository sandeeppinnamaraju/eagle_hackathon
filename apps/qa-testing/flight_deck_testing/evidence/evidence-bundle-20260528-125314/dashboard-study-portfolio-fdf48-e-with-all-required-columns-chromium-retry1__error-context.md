# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.js >> Study Portfolio Dashboard >> table toggle shows table with all required columns
- Location: tests\dashboard.spec.js:41:3

# Error details

```
Error: Login failed at https://spend-mhz-bufing-characteristics.trycloudflare.com/home :: Flight Deck
Home
Study Portfolio
Protocol Search
Configure
VIEWER
VI
Viewer User
Sign out
Flight Deck
Clinical Trials Intelligence
Pilot every protocol
with precision

Flight Deck is the operating cockpit for clinical operations teams. Turn enrollment signals, site performance, and protocol risk int
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
  18  | async function ensureLoggedIn(page, options = {}) {
  19  |   const baseUrl = getBaseUrl(options.baseUrl);
  20  |   const loginPath = options.loginPath || DEFAULT_LOGIN_PATH;
  21  |   const { username, password } = getCredentials();
  22  |   const loggedInAnchor = page
  23  |     .getByRole('button', { name: /sign out/i })
  24  |     .or(page.getByRole('link', { name: /Study Portfolio|Protocol Search|Home/i }))
  25  |     .first();
  26  | 
  27  |   await page.goto(`${baseUrl}${loginPath}`, { waitUntil: 'domcontentloaded' });
  28  |   await page.waitForLoadState('networkidle').catch(() => {});
  29  | 
  30  |   // Already authenticated sessions can be redirected to app shell immediately.
  31  |   if (await loggedInAnchor.isVisible().catch(() => false)) {
  32  |     return;
  33  |   }
  34  | 
  35  |   const usernameInput = page
  36  |     .getByLabel(/username|email/i)
  37  |     .or(page.getByPlaceholder(/enter your username|username|email/i))
  38  |     .or(page.locator('input[name*="user" i], input[name*="email" i], input[type="email"], input[type="text"]').first())
  39  |     .first();
  40  | 
  41  |   const passwordInput = page
  42  |     .getByLabel(/password/i)
  43  |     .or(page.getByPlaceholder(/password/i))
  44  |     .or(page.locator('input[type="password"], input[name*="pass" i]').first())
  45  |     .first();
  46  | 
  47  |   const signInButton = page
  48  |     .getByRole('button', { name: /sign in|log in|login/i })
  49  |     .or(page.locator('button[type="submit"]').first())
  50  |     .first();
  51  | 
  52  |   await expect(usernameInput).toBeVisible();
  53  |   await expect(passwordInput).toBeVisible();
  54  |   await expect(signInButton).toBeVisible();
  55  | 
  56  |   await usernameInput.fill(username);
  57  |   await passwordInput.fill(password);
  58  |   await signInButton.click();
  59  | 
  60  |   await page.waitForLoadState('networkidle').catch(() => {});
  61  | 
  62  |   if (await loggedInAnchor.isVisible().catch(() => false)) {
  63  |     return;
  64  |   }
  65  | 
  66  |   const stillOnLogin = /\/login\/?$/i.test(new URL(page.url()).pathname);
  67  |   const authError = page
  68  |     .getByText(/invalid|incorrect|failed|unauthorized|try again|not match|wrong credentials/i)
  69  |     .first();
  70  | 
  71  |   if (stillOnLogin || (await authError.isVisible().catch(() => false))) {
  72  |     const body = await page.locator('body').innerText().catch(() => '');
> 73  |     throw new Error(`Login failed at ${page.url()} :: ${body.slice(0, 300)}`);
      |           ^ Error: Login failed at https://spend-mhz-bufing-characteristics.trycloudflare.com/home :: Flight Deck
  74  |   }
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