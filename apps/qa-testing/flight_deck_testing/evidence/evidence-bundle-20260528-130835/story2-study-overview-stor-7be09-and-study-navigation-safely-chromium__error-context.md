# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: story2-study-overview.spec.js >> Story 2 - Study Overview >> shows portfolio overview and study navigation safely
- Location: tests\story2-study-overview.spec.js:75:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('table').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('table').first()

```

```yaml
- banner:
  - link "Flight Deck":
    - /url: /home
  - navigation:
    - link "Home":
      - /url: /home
    - link "Study Portfolio":
      - /url: /portfolio
    - link "Protocol Search":
      - /url: /protocol-search
    - link "Configure":
      - /url: /configure
  - text: VIEWER vi Viewer User
  - button "Sign out"
- main:
  - heading "Study Portfolio Dashboard" [level=1]
  - button "5 Insights"
  - textbox "Search by ID, title, indication..."
  - paragraph: Showing 0 of 0 studies
  - button "Therapeutic Area"
  - combobox: Phase
  - combobox: Study Status
  - combobox: Portfolio
  - combobox: Program
  - combobox: Region
  - button "FPI / LPO"
  - paragraph: Active Studies
  - paragraph: "683"
  - paragraph: recruiting or follow-up
  - paragraph: On Track
  - paragraph: 14.8%
  - paragraph: 101 of 683 active
  - paragraph: At Risk / Off Track
  - paragraph: 85.2%
  - paragraph: 582 of 683 active
  - paragraph: Enrollment vs Target
  - paragraph: 68.3%
  - paragraph: 1,193,847 of 1,747,330 patients
  - img
  - paragraph: Enrollment vs Plan (To Date)
  - paragraph: 68.3%
  - paragraph: 1,193,847 of 1,747,330 planned
  - paragraph: Velocity vs Plan
  - paragraph: 86.4%
  - paragraph: avg enrollment speed
  - button "Cards"
  - button "Table"
  - text: Loading studies...
- region "Notifications alt+T"
```

# Test source

```ts
  1   | const { test, expect } = require('../utils/stepTest');
  2   | const { setupAuthenticatedStudyPortfolio, openStudyPortfolio } = require('../utils/authNavigation');
  3   | 
  4   | const BASE_URL = 'https://spend-mhz-bufing-characteristics.trycloudflare.com/';
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
> 47  |   await expect(page.locator('table').first()).toBeVisible();
      |                                               ^ Error: expect(locator).toBeVisible() failed
  48  | }
  49  | 
  50  | async function navigateToFirstStudy(page) {
  51  |   await openPortfolio(page);
  52  |   await openTableView(page);
  53  | 
  54  |   const studyLinks = page.locator('a[href^="/studies/"]');
  55  |   if ((await studyLinks.count()) === 0) {
  56  |     return false;
  57  |   }
  58  | 
  59  |   const firstStudyLink = studyLinks.first();
  60  |   await expect(firstStudyLink).toBeVisible();
  61  |   await firstStudyLink.click();
  62  |   await expect(page).toHaveURL(/\/studies\/ST-\d{4}-\d{3}/i);
  63  |   await page.waitForLoadState('networkidle').catch(() => {});
  64  | 
  65  |   return true;
  66  | }
  67  | 
  68  | test.describe('Story 2 - Study Overview', () => {
  69  |   test.describe.configure({ timeout: 90_000 });
  70  | 
  71  |   test.beforeEach(async ({ page }) => {
  72  |     await setupAuthenticatedStudyPortfolio(page, { baseUrl: BASE_URL });
  73  |   });
  74  | 
  75  |   test('shows portfolio overview and study navigation safely', async ({ page }) => {
  76  |     await openPortfolio(page);
  77  |     await expect(page.getByRole('textbox', { name: /Search by ID, title, indication/i })).toBeVisible();
  78  | 
  79  |     for (const label of PORTFOLIO_KPIS) {
  80  |       await expect(page.getByText(exactLabelPattern(label)).first()).toBeVisible();
  81  |     }
  82  | 
  83  |     await openTableView(page);
  84  | 
  85  |     const rows = page.locator('table tbody tr');
  86  |     if ((await rows.count()) > 0) {
  87  |       await expect(rows.first()).toBeVisible();
  88  |     } else {
  89  |       await expect(page.getByText(/No Studies Found|0 of 0 studies|No data/i).first()).toBeVisible();
  90  |       return;
  91  |     }
  92  | 
  93  |     const navigated = await navigateToFirstStudy(page);
  94  |     if (!navigated) {
  95  |       return;
  96  |     }
  97  | 
  98  |     await expect(page.getByRole('link', { name: /Back to Study Portfolio/i })).toBeVisible();
  99  |     await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  100 |     await expect(page.getByText(/^ST-\d{4}-\d{3}$/).first()).toBeVisible();
  101 |   });
  102 | 
  103 |   test('shows study overview content with safe optional interactions', async ({ page }) => {
  104 |     const navigated = await navigateToFirstStudy(page);
  105 |     if (!navigated) {
  106 |       await expect(page.getByRole('heading', { name: /Study Portfolio Dashboard/i })).toBeVisible();
  107 |       return;
  108 |     }
  109 | 
  110 |     for (const label of HEADER_LABELS) {
  111 |       await expect(page.getByText(exactLabelPattern(label)).first()).toBeVisible();
  112 |     }
  113 | 
  114 |     for (const label of OVERVIEW_KPIS) {
  115 |       await expect(page.getByText(exactLabelPattern(label)).first()).toBeVisible();
  116 |     }
  117 | 
  118 |     await expect(page.getByRole('heading', { name: /CUMULATIVE ENROLLMENT/i })).toBeVisible();
  119 |     await expect(page.getByRole('heading', { name: /ENROLLMENT RATE/i })).toBeVisible();
  120 | 
  121 |     for (const label of ['Full Study', 'Since FPI', 'Last 3 Months']) {
  122 |       await expect(page.getByRole('button', { name: exactLabelPattern(label) })).toBeVisible();
  123 |     }
  124 | 
  125 |     const sinceFpiButton = page.getByRole('button', { name: /^Since FPI$/i });
  126 |     if (await sinceFpiButton.isVisible().catch(() => false)) {
  127 |       await sinceFpiButton.click();
  128 |       await expect(page.getByRole('heading', { name: /ENROLLMENT RATE/i })).toBeVisible();
  129 |     }
  130 | 
  131 |     const fullStudyButton = page.getByRole('button', { name: /^Full Study$/i });
  132 |     if (await fullStudyButton.isVisible().catch(() => false)) {
  133 |       await fullStudyButton.click();
  134 |       await expect(page.getByRole('heading', { name: /CUMULATIVE ENROLLMENT/i })).toBeVisible();
  135 |     }
  136 | 
  137 |     const byCountryButton = page.getByRole('button', { name: /^By Country$/i });
  138 |     if (await byCountryButton.isVisible().catch(() => false)) {
  139 |       await expect(byCountryButton).toBeVisible();
  140 |     }
  141 | 
  142 |     const bySiteButton = page.getByRole('button', { name: /^By Site$/i });
  143 |     if (await bySiteButton.isVisible().catch(() => false)) {
  144 |       await bySiteButton.click().catch(() => {});
  145 |     }
  146 | 
  147 |     const breakdownHeading = page.getByRole('heading', { name: /Country Breakdown|Site Breakdown/i }).first();
```