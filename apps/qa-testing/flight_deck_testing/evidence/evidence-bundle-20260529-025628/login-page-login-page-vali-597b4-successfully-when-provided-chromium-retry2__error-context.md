# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login-page.spec.js >> Login page validation >> valid credentials sign in successfully when provided
- Location: tests\login-page.spec.js:101:3

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
  55  |     await openLoginPage();
  56  | 
  57  |     await expect(page.getByText(/Flight Deck/i).first()).toBeVisible();
  58  |     await expect(page.getByRole('heading', { name: /sign in/i }).first()).toBeVisible();
  59  |     await expect(getUsernameInput()).toBeVisible();
  60  |     await expect(getPasswordInput()).toBeVisible();
  61  |     await expect(getSignInButton()).toBeVisible();
  62  |   });
  63  | 
  64  |   test('empty submit is handled safely', async () => {
  65  |     await openLoginPage();
  66  | 
  67  |     await getSignInButton().click();
  68  |     await page.waitForLoadState('networkidle').catch(() => {});
  69  | 
  70  |     const validationHint = page
  71  |       .getByText(/required|enter your username|enter your password|must not be empty/i)
  72  |       .first();
  73  | 
  74  |     if (await validationHint.isVisible().catch(() => false)) {
  75  |       await expect(validationHint).toBeVisible();
  76  |     } else {
  77  |       await expect(page.getByRole('heading', { name: /sign in/i }).first()).toBeVisible();
  78  |       await expect(getSignInButton()).toBeVisible();
  79  |     }
  80  |   });
  81  | 
  82  |   test('invalid credentials do not navigate to app shell', async () => {
  83  |     await openLoginPage();
  84  | 
  85  |     await getUsernameInput().fill('invalid.user@example.com');
  86  |     await getPasswordInput().fill('WrongPassword123!');
  87  |     await getSignInButton().click();
  88  |     await page.waitForLoadState('networkidle').catch(() => {});
  89  | 
  90  |     const authError = page
  91  |       .getByText(/invalid|incorrect|failed|unauthorized|try again|not match|wrong credentials/i)
  92  |       .first();
  93  | 
  94  |     if (await authError.isVisible().catch(() => false)) {
  95  |       await expect(authError).toBeVisible();
  96  |     } else {
  97  |       await expect(page.getByRole('heading', { name: /sign in/i }).first()).toBeVisible();
  98  |     }
  99  |   });
  100 | 
  101 |   test('valid credentials sign in successfully when provided', async () => {
  102 |     test.skip(!VALID_USERNAME || !VALID_PASSWORD, 'Set LOGIN_USERNAME and LOGIN_PASSWORD to enable this test.');
  103 | 
  104 | 
  105 |     await openLoginPage();
  106 |     const beforePath = new URL(page.url()).pathname;
  107 | 
  108 |     // Simulate realistic typing and focus
  109 |     const usernameInput = getUsernameInput();
  110 |     const passwordInput = getPasswordInput();
  111 |     await usernameInput.click();
  112 |     await page.waitForTimeout(200);
  113 |     await usernameInput.fill(''); // Clear any autofill
  114 |     await usernameInput.type(VALID_USERNAME, { delay: 120 });
  115 |     await page.waitForTimeout(200);
  116 |     await passwordInput.click();
  117 |     await page.waitForTimeout(200);
  118 |     await passwordInput.fill(''); // Clear any autofill
  119 |     await passwordInput.type(VALID_PASSWORD, { delay: 120 });
  120 |     await page.waitForTimeout(300);
  121 | 
  122 |     // Log field values for debug
  123 |     const typedUsername = await usernameInput.inputValue();
  124 |     const typedPassword = await passwordInput.inputValue();
  125 |     console.log('Typed username:', typedUsername);
  126 |     console.log('Typed password length:', typedPassword.length);
  127 | 
  128 |     await getSignInButton().focus();
  129 |     await page.waitForTimeout(100);
  130 |     await getSignInButton().click();
  131 |     await page.waitForTimeout(1000);
  132 | 
  133 |     // Wait for dashboard heading or error message after login
  134 |     const dashboardHeading = page.getByRole('heading', { name: /Study Portfolio Dashboard|Portfolio Dashboard|Flight Deck/i }).first();
  135 |     const loginError = page.getByText(/invalid|incorrect|failed|unauthorized|try again|not match|wrong credentials/i).first();
  136 | 
  137 |     // Wait up to 20s for either dashboard or error
  138 |     const dashboardVisible = await dashboardHeading.isVisible({ timeout: 20000 }).catch(() => false);
  139 |     const errorVisible = await loginError.isVisible().catch(() => false);
  140 | 
  141 |     if (dashboardVisible) {
  142 |       await expect(dashboardHeading).toBeVisible();
  143 |       return;
  144 |     }
  145 |     if (errorVisible) {
  146 |       const errorText = await loginError.innerText().catch(() => '');
  147 |       throw new Error('Login failed with error: ' + errorText);
  148 |     }
  149 | 
  150 |     // Fallback: check if URL changed
  151 |     const afterPath = new URL(page.url()).pathname;
  152 |     if (afterPath === beforePath) {
  153 |       const pageContent = await page.content();
  154 |       console.error('Login did not navigate away from login page.\nCurrent URL:', page.url(), '\nPage content:', pageContent.slice(0, 1000));
> 155 |       throw new Error('Login did not navigate away from login page. Check credentials, backend, and UI for issues.');
      |             ^ Error: Login did not navigate away from login page. Check credentials, backend, and UI for issues.
  156 |     }
  157 | 
  158 |     // If redirected to /home, consider login successful
  159 |     if (afterPath === '/home' || afterPath === 'home') {
  160 |       expect(true).toBeTruthy(); // Pass
  161 |       return;
  162 |     }
  163 | 
  164 |     expect(/login|sign-?in/i.test(afterPath)).toBeFalsy();
  165 |   });
  166 | });
  167 | 
```