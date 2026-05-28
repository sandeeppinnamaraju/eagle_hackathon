# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login-page.spec.js >> Login page validation >> valid credentials sign in successfully when provided
- Location: tests\login-page.spec.js:100:3

# Error details

```
Error: Login failed with error: Unable to sign in right now. Please check your credentials and try again.
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
            - paragraph [ref=e58]: Unable to sign in right now. Please check your credentials and try again.
            - button "Sign in" [ref=e59]
  - region "Notifications alt+T"
```

# Test source

```ts
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
  125 |     // Wait up to 15s for either dashboard or error
  126 |     const dashboardVisible = await dashboardHeading.isVisible({ timeout: 15000 }).catch(() => false);
  127 |     const errorVisible = await loginError.isVisible().catch(() => false);
  128 | 
  129 |     if (dashboardVisible) {
  130 |       await expect(dashboardHeading).toBeVisible();
  131 |       return;
  132 |     }
  133 |     if (errorVisible) {
  134 |       const errorText = await loginError.innerText().catch(() => '');
> 135 |       throw new Error('Login failed with error: ' + errorText);
      |             ^ Error: Login failed with error: Unable to sign in right now. Please check your credentials and try again.
  136 |     }
  137 | 
  138 |     // Fallback: check if URL changed
  139 |     const afterPath = new URL(page.url()).pathname;
  140 |     expect(afterPath).not.toBe(beforePath);
  141 |     expect(/login|sign-?in/i.test(afterPath)).toBeFalsy();
  142 |   });
  143 | });
  144 | 
```