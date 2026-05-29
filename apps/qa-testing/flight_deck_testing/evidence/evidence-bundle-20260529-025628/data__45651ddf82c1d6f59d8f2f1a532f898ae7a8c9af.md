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
  103 | 
  104 |     await openLoginPage();
  105 |     const beforePath = new URL(page.url()).pathname;
  106 | 
  107 |     // Simulate realistic typing and focus
  108 |     const usernameInput = getUsernameInput();
  109 |     const passwordInput = getPasswordInput();
  110 |     await usernameInput.click();
  111 |     await page.waitForTimeout(200);
  112 |     await usernameInput.fill(''); // Clear any autofill
  113 |     await usernameInput.type(VALID_USERNAME, { delay: 120 });
  114 |     await page.waitForTimeout(200);
  115 |     await passwordInput.click();
  116 |     await page.waitForTimeout(200);
  117 |     await passwordInput.fill(''); // Clear any autofill
  118 |     await passwordInput.type(VALID_PASSWORD, { delay: 120 });
  119 |     await page.waitForTimeout(300);
  120 | 
  121 |     // Log field values for debug
  122 |     const typedUsername = await usernameInput.inputValue();
  123 |     const typedPassword = await passwordInput.inputValue();
  124 |     console.log('Typed username:', typedUsername);
  125 |     console.log('Typed password length:', typedPassword.length);
  126 | 
  127 |     await getSignInButton().focus();
  128 |     await page.waitForTimeout(100);
  129 |     await getSignInButton().click();
  130 |     await page.waitForTimeout(1000);
  131 | 
  132 |     // Wait for dashboard heading or error message after login
  133 |     const dashboardHeading = page.getByRole('heading', { name: /Study Portfolio Dashboard|Portfolio Dashboard|Flight Deck/i }).first();
  134 |     const loginError = page.getByText(/invalid|incorrect|failed|unauthorized|try again|not match|wrong credentials/i).first();
  135 | 
  136 |     // Wait up to 20s for either dashboard or error
  137 |     const dashboardVisible = await dashboardHeading.isVisible({ timeout: 20000 }).catch(() => false);
  138 |     const errorVisible = await loginError.isVisible().catch(() => false);
  139 | 
  140 |     if (dashboardVisible) {
  141 |       await expect(dashboardHeading).toBeVisible();
  142 |       return;
  143 |     }
  144 |     if (errorVisible) {
  145 |       const errorText = await loginError.innerText().catch(() => '');
  146 |       throw new Error('Login failed with error: ' + errorText);
  147 |     }
  148 | 
  149 |     // Fallback: check if URL changed
  150 |     const afterPath = new URL(page.url()).pathname;
  151 |     if (afterPath === beforePath) {
  152 |       const pageContent = await page.content();
  153 |       console.error('Login did not navigate away from login page.\nCurrent URL:', page.url(), '\nPage content:', pageContent.slice(0, 1000));
> 154 |       throw new Error('Login did not navigate away from login page. Check credentials, backend, and UI for issues.');
      |             ^ Error: Login did not navigate away from login page. Check credentials, backend, and UI for issues.
  155 |     }
  156 | 
  157 |     // If redirected to /home, consider login successful
  158 |     if (afterPath === '/home' || afterPath === 'home') {
  159 |       expect(true).toBeTruthy(); // Pass
  160 |       return;
  161 |     }
  162 | 
  163 |     expect(/login|sign-?in/i.test(afterPath)).toBeFalsy();
  164 |   });
  165 | });
  166 | 
```