# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login-page.spec.js >> Login page validation >> valid credentials sign in successfully when provided
- Location: tests\login-page.spec.js:100:3

# Error details

```
Error: Login did not navigate away from login page. Check credentials, backend, and UI for issues.
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
                - text: eagle_user1
            - generic [ref=e51]:
              - text: Password
              - generic [ref=e52]:
                - textbox "Password" [ref=e53]:
                  - /placeholder: ••••••••
                  - text: FD_hack@user1
                - button "Show password" [ref=e54]:
                  - img [ref=e55]
            - button "Signing in..." [disabled] [ref=e58]
  - region "Notifications alt+T"
```

# Test source

```ts
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
  106 |     // Simulate realistic typing and focus
  107 |     const usernameInput = getUsernameInput();
  108 |     const passwordInput = getPasswordInput();
  109 |     await usernameInput.click();
  110 |     await page.waitForTimeout(200);
  111 |     await usernameInput.fill(VALID_USERNAME, { timeout: 2000 });
  112 |     await page.waitForTimeout(200);
  113 |     await passwordInput.click();
  114 |     await page.waitForTimeout(200);
  115 |     await passwordInput.fill(VALID_PASSWORD, { timeout: 2000 });
  116 |     await page.waitForTimeout(300);
  117 |     await getSignInButton().click();
  118 |     await page.waitForTimeout(500);
  119 | 
  120 |     // Wait for dashboard heading or error message after login
  121 |     const dashboardHeading = page.getByRole('heading', { name: /Study Portfolio Dashboard|Portfolio Dashboard|Flight Deck/i }).first();
  122 |     const loginError = page.getByText(/invalid|incorrect|failed|unauthorized|try again|not match|wrong credentials/i).first();
  123 | 
  124 |     // Wait up to 20s for either dashboard or error
  125 |     const dashboardVisible = await dashboardHeading.isVisible({ timeout: 20000 }).catch(() => false);
  126 |     const errorVisible = await loginError.isVisible().catch(() => false);
  127 | 
  128 |     if (dashboardVisible) {
  129 |       await expect(dashboardHeading).toBeVisible();
  130 |       return;
  131 |     }
  132 |     if (errorVisible) {
  133 |       const errorText = await loginError.innerText().catch(() => '');
  134 |       throw new Error('Login failed with error: ' + errorText);
  135 |     }
  136 | 
  137 |     // Fallback: check if URL changed
  138 |     const afterPath = new URL(page.url()).pathname;
  139 |     if (afterPath === beforePath) {
  140 |       // Print debug info for diagnosis
  141 |       const pageContent = await page.content();
  142 |       console.error('Login did not navigate away from login page.\nCurrent URL:', page.url(), '\nPage content:', pageContent.slice(0, 1000));
> 143 |       throw new Error('Login did not navigate away from login page. Check credentials, backend, and UI for issues.');
      |             ^ Error: Login did not navigate away from login page. Check credentials, backend, and UI for issues.
  144 |     }
  145 |     expect(/login|sign-?in/i.test(afterPath)).toBeFalsy();
  146 |   });
  147 | });
  148 | 
```