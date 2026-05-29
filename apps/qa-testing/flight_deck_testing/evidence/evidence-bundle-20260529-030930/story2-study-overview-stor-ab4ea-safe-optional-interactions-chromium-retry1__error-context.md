# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: story2-study-overview.spec.js >> Story 2 - Study Overview >> shows study overview content with safe optional interactions
- Location: tests\story2-study-overview.spec.js:106:3

# Error details

```
Error: expect(locator).toBeHidden() failed

Locator:  getByText(/Loading studies\.\.\./i).first()
Expected: hidden
Received: visible
Timeout:  30000ms

Call log:
  - Expect "toBeHidden" with timeout 30000ms
  - waiting for getByText(/Loading studies\.\.\./i).first()
    62 × locator resolved to <div class="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">Loading studies...</div>
       - unexpected value "visible"

```

```yaml
- text: Loading studies...
```

# Test source

```ts
  1   | const { test, expect } = require('../utils/stepTest');
  2   | const { setupAuthenticatedStudyPortfolio, openStudyPortfolio } = require('../utils/authNavigation');
  3   | 
  4   | const BASE_URL = 'https://eagle-frontend01-hpe9hhhngdc9addx.centralus-01.azurewebsites.net/'; // username: eagle_user1, password: FD_hack@user1
  5   | 
  6   | const PORTFOLIO_KPIS = [
  7   |   'Active Studies',
  8   |   'On Track',
  9   |   'At Risk / Off Track',
  10  |   'Enrollment vs Target',
  11  |   'Enrollment vs Plan (To Date)',
  12  |   'Velocity vs Plan',
  13  | ];
  14  | 
  15  | const OVERVIEW_KPIS = [
  16  |   'Enrollment vs Plan',
  17  |   'Enrollment Rate',
  18  |   'Screen Failure Rate',
  19  |   'Dropout Rate',
  20  |   'Sites Activated',
  21  |   'Countries Activated',
  22  | ];
  23  | 
  24  | const HEADER_LABELS = [
  25  |   'Asset',
  26  |   'Asset Lead',
  27  |   'FSO Model',
  28  |   'Study Sponsor',
  29  |   'Designation',
  30  |   'Target Enrollment',
  31  | ];
  32  | 
  33  | function exactLabelPattern(label) {
  34  |   return new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  35  | }
  36  | 
  37  | async function openPortfolio(page) {
  38  |   await openStudyPortfolio(page, { baseUrl: BASE_URL });
  39  | }
  40  | 
  41  | async function openTableView(page) {
  42  |   const tableButton = page.getByRole('button', { name: /^Table$/ });
  43  |   if (await tableButton.isVisible().catch(() => false)) {
  44  |     await tableButton.click();
  45  |   }
  46  | 
  47  |   const loadingText = page.getByText(/Loading studies\.\.\./i).first();
  48  |   if (await loadingText.isVisible().catch(() => false)) {
> 49  |     await expect(loadingText).toBeHidden({ timeout: 30_000 });
      |                               ^ Error: expect(locator).toBeHidden() failed
  50  |   }
  51  | }
  52  | 
  53  | async function navigateToFirstStudy(page) {
  54  |   await openPortfolio(page);
  55  |   await openTableView(page);
  56  | 
  57  |   const studyLinks = page.locator('a[href^="/studies/"]');
  58  |   if ((await studyLinks.count()) === 0) {
  59  |     return false;
  60  |   }
  61  | 
  62  |   const firstStudyLink = studyLinks.first();
  63  |   await expect(firstStudyLink).toBeVisible();
  64  |   await firstStudyLink.click();
  65  |   await expect(page).toHaveURL(/\/studies\/ST-\d{4}-\d{3}/i);
  66  |   await page.waitForLoadState('networkidle').catch(() => {});
  67  | 
  68  |   return true;
  69  | }
  70  | 
  71  | test.describe('Story 2 - Study Overview', () => {
  72  |   test.describe.configure({ timeout: 90_000 });
  73  | 
  74  |   test.beforeEach(async ({ page }) => {
  75  |     await setupAuthenticatedStudyPortfolio(page, { baseUrl: BASE_URL });
  76  |   });
  77  | 
  78  |   test('shows portfolio overview and study navigation safely', async ({ page }) => {
  79  |     await openPortfolio(page);
  80  |     await expect(page.getByRole('textbox', { name: /Search by ID, title, indication/i })).toBeVisible();
  81  | 
  82  |     for (const label of PORTFOLIO_KPIS) {
  83  |       await expect(page.getByText(exactLabelPattern(label)).first()).toBeVisible();
  84  |     }
  85  | 
  86  |     await openTableView(page);
  87  | 
  88  |     const rows = page.locator('table tbody tr');
  89  |     if ((await rows.count()) > 0) {
  90  |       await expect(rows.first()).toBeVisible();
  91  |     } else {
  92  |       await expect(page.getByText(/No Studies Found|0 of 0 studies|No data/i).first()).toBeVisible();
  93  |       return;
  94  |     }
  95  | 
  96  |     const navigated = await navigateToFirstStudy(page);
  97  |     if (!navigated) {
  98  |       return;
  99  |     }
  100 | 
  101 |     await expect(page.getByRole('link', { name: /Back to Study Portfolio/i })).toBeVisible();
  102 |     await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  103 |     await expect(page.getByText(/^ST-\d{4}-\d{3}$/).first()).toBeVisible();
  104 |   });
  105 | 
  106 |   test('shows study overview content with safe optional interactions', async ({ page }) => {
  107 |     const navigated = await navigateToFirstStudy(page);
  108 |     if (!navigated) {
  109 |       await expect(page.getByRole('heading', { name: /Study Portfolio Dashboard/i })).toBeVisible();
  110 |       return;
  111 |     }
  112 | 
  113 |     for (const label of HEADER_LABELS) {
  114 |       await expect(page.getByText(exactLabelPattern(label)).first()).toBeVisible();
  115 |     }
  116 | 
  117 |     for (const label of OVERVIEW_KPIS) {
  118 |       await expect(page.getByText(exactLabelPattern(label)).first()).toBeVisible();
  119 |     }
  120 | 
  121 |     await expect(page.getByRole('heading', { name: /CUMULATIVE ENROLLMENT/i })).toBeVisible();
  122 |     await expect(page.getByRole('heading', { name: /ENROLLMENT RATE/i })).toBeVisible();
  123 | 
  124 |     for (const label of ['Full Study', 'Since FPI', 'Last 3 Months']) {
  125 |       await expect(page.getByRole('button', { name: exactLabelPattern(label) })).toBeVisible();
  126 |     }
  127 | 
  128 |     const sinceFpiButton = page.getByRole('button', { name: /^Since FPI$/i });
  129 |     if (await sinceFpiButton.isVisible().catch(() => false)) {
  130 |       await sinceFpiButton.click();
  131 |       await expect(page.getByRole('heading', { name: /ENROLLMENT RATE/i })).toBeVisible();
  132 |     }
  133 | 
  134 |     const fullStudyButton = page.getByRole('button', { name: /^Full Study$/i });
  135 |     if (await fullStudyButton.isVisible().catch(() => false)) {
  136 |       await fullStudyButton.click();
  137 |       await expect(page.getByRole('heading', { name: /CUMULATIVE ENROLLMENT/i })).toBeVisible();
  138 |     }
  139 | 
  140 |     const byCountryButton = page.getByRole('button', { name: /^By Country$/i });
  141 |     if (await byCountryButton.isVisible().catch(() => false)) {
  142 |       await expect(byCountryButton).toBeVisible();
  143 |     }
  144 | 
  145 |     const bySiteButton = page.getByRole('button', { name: /^By Site$/i });
  146 |     if (await bySiteButton.isVisible().catch(() => false)) {
  147 |       await bySiteButton.click().catch(() => {});
  148 |     }
  149 | 
```