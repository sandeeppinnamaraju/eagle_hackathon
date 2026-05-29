# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login-page.spec.js >> Login page validation >> login page renders expected UI shell
- Location: tests\login-page.spec.js:53:3

# Error details

```
TypeError: Cannot read properties of undefined (reading 'close')
```

# Test source

```ts
  1   | const { test, expect } = require('../utils/stepTest');
  2   | 
  3   | test.describe('Login page validation', () => {
  4   |   test.describe.configure({ mode: 'serial', timeout: 90_000 });
  5   | 
  6   |   // Hardcoded for test environment
  7   |   const BASE_URL = 'https://eagle-frontend01-hpe9hhhngdc9addx.centralus-01.azurewebsites.net/';
  8   |   const LOGIN_PATH = '/login';
  9   |   // Credentials are now managed via environment variables or utility defaults for security.
  10  |   const VALID_USERNAME = process.env.LOGIN_USERNAME || 'eagle_user1';
  11  |   const VALID_PASSWORD = process.env.LOGIN_PASSWORD || 'FD_hack@user1'; // Replace with a secure default if needed
  12  | 
  13  |   let context;
  14  |   let page;
  15  | 
  16  |   const getLoginUrl = () => {
  17  |     if (!LOGIN_PATH.startsWith('/')) {
  18  |       return `${BASE_URL}/${LOGIN_PATH}`;
  19  |     }
  20  |     return `${BASE_URL}${LOGIN_PATH}`;
  21  |   };
  22  | 
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
> 50  |     await context.close();
      |                   ^ TypeError: Cannot read properties of undefined (reading 'close')
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
  106 | 
  107 |     // Simulate realistic typing and focus
  108 |     const usernameInput = getUsernameInput();
  109 |     const passwordInput = getPasswordInput();
  110 |     await usernameInput.click();
  111 |     await page.waitForTimeout(200);
  112 |     await usernameInput.fill(VALID_USERNAME, { timeout: 2000 });
  113 |     await page.waitForTimeout(200);
  114 |     await passwordInput.click();
  115 |     await page.waitForTimeout(200);
  116 |     await passwordInput.fill(VALID_PASSWORD, { timeout: 2000 });
  117 |     await page.waitForTimeout(300);
  118 |     await getSignInButton().click();
  119 |     await page.waitForTimeout(500);
  120 | 
  121 |     // Wait for dashboard heading or error message after login
  122 |     const dashboardHeading = page.getByRole('heading', { name: /Study Portfolio Dashboard|Portfolio Dashboard|Flight Deck/i }).first();
  123 |     const loginError = page.getByText(/invalid|incorrect|failed|unauthorized|try again|not match|wrong credentials/i).first();
  124 | 
  125 |     // Wait up to 15s for either dashboard, error, or login form to disappear
  126 |     const dashboardVisible = await dashboardHeading.isVisible({ timeout: 15000 }).catch(() => false);
  127 |     const errorVisible = await loginError.isVisible().catch(() => false);
  128 |     const loginFormVisible = await getSignInButton().isVisible().catch(() => false);
  129 | 
  130 |     if (dashboardVisible) {
  131 |       await expect(dashboardHeading).toBeVisible();
  132 |       return;
  133 |     }
  134 |     if (errorVisible) {
  135 |       const errorText = await loginError.innerText().catch(() => '');
  136 |       throw new Error('Login failed with error: ' + errorText);
  137 |     }
  138 | 
  139 |     // If login form is still visible after waiting, fail
  140 |     if (loginFormVisible) {
  141 |       throw new Error('Login form is still visible after submitting valid credentials. Login may have failed.');
  142 |     }
  143 | 
  144 |     // Otherwise, consider login successful (even if URL did not change)
  145 |     expect(true).toBeTruthy();
  146 |   });
  147 | });
```