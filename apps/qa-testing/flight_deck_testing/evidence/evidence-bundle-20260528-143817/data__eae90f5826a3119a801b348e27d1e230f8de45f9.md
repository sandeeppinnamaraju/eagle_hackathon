# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login-page.spec.js >> Login page validation >> valid credentials sign in successfully when provided
- Location: tests\login-page.spec.js:100:3

# Error details

```
Error: expect(received).not.toBe(expected) // Object.is equality

Expected: not "/login"
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
      - generic [ref=e21]:
        - generic [ref=e22]: VIEWER
        - generic [ref=e24]:
          - generic [ref=e25]: ea
          - generic [ref=e26]: Eagle_user1 User
        - button "Sign out" [ref=e27]:
          - img [ref=e28]
          - text: Sign out
  - main [ref=e31]:
    - generic [ref=e32]:
      - generic [ref=e33]:
        - img [ref=e34]
        - text: Flight Deck
      - heading "Welcome to Flight Deck" [level=1] [ref=e36]
      - paragraph [ref=e37]: The operating cockpit for clinical operations. Pick where you want to go next.
      - generic [ref=e38]:
        - link "Study Portfolio Browse every active and planned study with live enrollment, site coverage, and performance signals in one place. Open" [ref=e39] [cursor=pointer]:
          - /url: /portfolio
          - img [ref=e41]
          - heading "Study Portfolio" [level=2] [ref=e46]
          - paragraph [ref=e47]: Browse every active and planned study with live enrollment, site coverage, and performance signals in one place.
          - generic [ref=e48]:
            - text: Open
            - img [ref=e49]
        - link "Protocol Search Search across protocols to find precedents, eligibility patterns, and design intelligence for your next study. Open" [ref=e51] [cursor=pointer]:
          - /url: /protocol-search
          - img [ref=e53]
          - heading "Protocol Search" [level=2] [ref=e56]
          - paragraph [ref=e57]: Search across protocols to find precedents, eligibility patterns, and design intelligence for your next study.
          - generic [ref=e58]:
            - text: Open
            - img [ref=e59]
  - region "Notifications alt+T"
```

# Test source

```ts
  23  |   const getUsernameInput = () =>
  24  |     page
  25  |       .getByLabel(/username|email/i)
  26  |       .or(page.getByPlaceholder(/enter your username|username|email/i))
  27  |       .or(page.locator('input[name*="user" i], input[name*="email" i], input[type="email"], input[type="text"]').first())
  28  |       .first();
  29  | 
  30  |   const getPasswordInput = () =>
  31  |     page
  32  |       .getByLabel(/password/i)
  33  |       .or(page.getByPlaceholder(/password/i))
  34  |       .or(page.locator('input[type="password"], input[name*="pass" i]').first())
  35  |       .first();
  36  | 
  37  |   const getSignInButton = () => page.getByRole('button', { name: /sign in|log in|login/i }).first();
  38  | 
  39  |   const openLoginPage = async () => {
  40  |     await page.goto(getLoginUrl(), { waitUntil: 'domcontentloaded' });
  41  |     await page.waitForLoadState('networkidle').catch(() => {});
  42  |   };
  43  | 
  44  |   test.beforeAll(async ({ browser }) => {
  45  |     context = await browser.newContext();
  46  |     page = await context.newPage();
  47  |   });
  48  | 
  49  |   test.afterAll(async () => {
  50  |     await context.close();
  51  |   });
  52  | 
  53  |   test('login page renders expected UI shell', async () => {
  54  |     await openLoginPage();
  55  | 
  56  |     await expect(page.getByText(/Flight Deck/i).first()).toBeVisible();
  57  |     await expect(page.getByRole('heading', { name: /sign in/i }).first()).toBeVisible();
  58  |     await expect(getUsernameInput()).toBeVisible();
  59  |     await expect(getPasswordInput()).toBeVisible();
  60  |     await expect(getSignInButton()).toBeVisible();
  61  |   });
  62  | 
  63  |   test('empty submit is handled safely', async () => {
  64  |     await openLoginPage();
  65  | 
  66  |     await getSignInButton().click();
  67  |     await page.waitForLoadState('networkidle').catch(() => {});
  68  | 
  69  |     const validationHint = page
  70  |       .getByText(/required|enter your username|enter your password|must not be empty/i)
  71  |       .first();
  72  | 
  73  |     if (await validationHint.isVisible().catch(() => false)) {
  74  |       await expect(validationHint).toBeVisible();
  75  |     } else {
  76  |       await expect(page.getByRole('heading', { name: /sign in/i }).first()).toBeVisible();
  77  |       await expect(getSignInButton()).toBeVisible();
  78  |     }
  79  |   });
  80  | 
  81  |   test('invalid credentials do not navigate to app shell', async () => {
  82  |     await openLoginPage();
  83  | 
  84  |     await getUsernameInput().fill('invalid.user@example.com');
  85  |     await getPasswordInput().fill('WrongPassword123!');
  86  |     await getSignInButton().click();
  87  |     await page.waitForLoadState('networkidle').catch(() => {});
  88  | 
  89  |     const authError = page
  90  |       .getByText(/invalid|incorrect|failed|unauthorized|try again|not match|wrong credentials/i)
  91  |       .first();
  92  | 
  93  |     if (await authError.isVisible().catch(() => false)) {
  94  |       await expect(authError).toBeVisible();
  95  |     } else {
  96  |       await expect(page.getByRole('heading', { name: /sign in/i }).first()).toBeVisible();
  97  |     }
  98  |   });
  99  | 
  100 |   test('valid credentials sign in successfully when provided', async () => {
  101 |     test.skip(!VALID_USERNAME || !VALID_PASSWORD, 'Set LOGIN_USERNAME and LOGIN_PASSWORD to enable this test.');
  102 | 
  103 |     await openLoginPage();
  104 |     const beforePath = new URL(page.url()).pathname;
  105 | 
  106 |     await getUsernameInput().fill(VALID_USERNAME);
  107 |     await getPasswordInput().fill(VALID_PASSWORD);
  108 |     await getSignInButton().click();
  109 |     await page.waitForLoadState('networkidle').catch(() => {});
  110 | 
  111 |     const afterPath = new URL(page.url()).pathname;
  112 |     const appShellAnchor = page
  113 |       .getByRole('heading', { name: /Study Portfolio Dashboard|Portfolio Dashboard|Flight Deck/i })
  114 |       .or(page.getByRole('link', { name: /Study Portfolio|Protocol Search|Study Overview/i }))
  115 |       .or(page.getByRole('button', { name: /^Table$|^Cards$/i }))
  116 |       .first();
  117 | 
  118 |     if (await appShellAnchor.isVisible().catch(() => false)) {
  119 |       await expect(appShellAnchor).toBeVisible();
  120 |       return;
  121 |     }
  122 | 
> 123 |     expect(afterPath).not.toBe(beforePath);
      |                           ^ Error: expect(received).not.toBe(expected) // Object.is equality
  124 |     expect(/login|sign-?in/i.test(afterPath)).toBeFalsy();
  125 |   });
  126 | });
  127 | 
```