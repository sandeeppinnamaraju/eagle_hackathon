# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: story2-study-overview.spec.js >> Story 2 - Study Overview >> smooth end-to-end journey: complete Story 2 checks in a single browser flow
- Location: tests\story2-study-overview.spec.js:59:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Portfolio Dashboard' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: 'Portfolio Dashboard' })

```

```yaml
- text: "{\"error\":\"Only HTML requests are supported here\"}"
```

# Test source

```ts
  1   | const { test, expect } = require('../utils/stepTest');
  2   | const { EXPECTED_COLUMNS } = require('../fixtures/dashboardData');
  3   | 
  4   | test.describe('Story 2 - Study Overview', () => {
  5   |   test.describe.configure({ mode: 'serial' });
  6   | 
  7   |   let context;
  8   |   let page;
  9   | 
  10  |   const openDashboard = async () => {
  11  |     await page.goto('https://legislature-valued-short-facilitate.trycloudflare.com/');
  12  |     await page.waitForLoadState('networkidle').catch(() => {});
> 13  |     await expect(page.getByRole('heading', { name: 'Portfolio Dashboard' })).toBeVisible();
      |                                                                              ^ Error: expect(locator).toBeVisible() failed
  14  |   };
  15  | 
  16  |   const goToStudiesList = async () => {
  17  |     await openDashboard();
  18  |     await page.getByRole('link', { name: 'Study Overview' }).first().click();
  19  |     await page.waitForLoadState('networkidle').catch(() => {});
  20  |     await expect(page).toHaveURL(/\/studies\/?$/);
  21  |     await expect(page.getByRole('heading', { name: /Studies/i })).toBeVisible();
  22  |   };
  23  | 
  24  |   const openFirstStudyDetailFromDashboard = async () => {
  25  |     await openDashboard();
  26  | 
  27  |     const cardLink = page.locator('a[href^="/studies/"]').first();
  28  |     if ((await cardLink.count()) > 0) {
  29  |       await cardLink.click({ force: true });
  30  |       await page.waitForLoadState('networkidle').catch(() => {});
  31  |       return;
  32  |     }
  33  | 
  34  |     await page.getByRole('button', { name: 'Table' }).first().click().catch(() => {});
  35  |     const tableLink = page.locator('table tbody tr td a[href^="/studies/"]').first();
  36  |     await expect(tableLink).toBeVisible();
  37  |     await tableLink.click({ force: true });
  38  |     await page.waitForLoadState('networkidle').catch(() => {});
  39  |   };
  40  | 
  41  |   const openFirstStudyDetailFromStudiesList = async () => {
  42  |     await goToStudiesList();
  43  |     const firstStudyLink = page.locator('table tbody tr td a[href^="/studies/"]').first();
  44  |     await expect(firstStudyLink).toBeVisible();
  45  |     await firstStudyLink.click({ force: true });
  46  |     await page.waitForLoadState('networkidle').catch(() => {});
  47  |   };
  48  | 
  49  |   test.beforeAll(async ({ browser }) => {
  50  |     context = await browser.newContext();
  51  |     page = await context.newPage();
  52  |     await openDashboard();
  53  |   });
  54  | 
  55  |   test.afterAll(async () => {
  56  |     await context.close();
  57  |   });
  58  | 
  59  |   test('smooth end-to-end journey: complete Story 2 checks in a single browser flow', async () => {
  60  |     // 1) Navigation from dashboard into a study detail page
  61  |     await openFirstStudyDetailFromDashboard();
  62  |     await expect(page).toHaveURL(/\/studies\/ST-\d{4}-\d{3}/i);
  63  |     await expect(page.getByRole('link', { name: /Back to Studies/i })).toBeVisible();
  64  |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  65  | 
  66  |     // 2) Navigate back to studies list and validate table + required columns
  67  |     await page.getByRole('link', { name: /Back to Studies/i }).click();
  68  |     await page.waitForLoadState('networkidle').catch(() => {});
  69  |     await expect(page).toHaveURL(/\/studies\/?$/);
  70  |     await expect(page.getByRole('heading', { name: /Studies/i })).toBeVisible();
  71  | 
  72  |     const table = page.locator('table, [role="table"]').first();
  73  |     await expect(table).toBeVisible();
  74  | 
  75  |     const headers = await page.locator('table thead th').allInnerTexts();
  76  |     const normalizedHeaders = headers.map((header) => header.replace(/\s+/g, ' ').trim().toLowerCase());
  77  | 
  78  |     for (const expectedColumn of EXPECTED_COLUMNS) {
  79  |       expect(normalizedHeaders).toContain(expectedColumn.toLowerCase());
  80  |       await expect(
  81  |         page
  82  |           .getByRole('columnheader', {
  83  |             name: new RegExp(`^${expectedColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  84  |           })
  85  |           .first(),
  86  |       ).toBeVisible();
  87  |     }
  88  | 
  89  |     // 3) Open a study detail from studies list for deep validations
  90  |     const firstStudyLink = page.locator('table tbody tr td a[href^="/studies/"]').first();
  91  |     await expect(firstStudyLink).toBeVisible();
  92  |     await firstStudyLink.click({ force: true });
  93  |     await page.waitForLoadState('networkidle').catch(() => {});
  94  | 
  95  |     // 4) Header section + study attributes
  96  |     await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  97  | 
  98  |     const headerBadges = ['Ph I', 'Ph II', 'Recruiting', 'High Priority', 'Off Track', 'On Track', 'At Risk'];
  99  |     const anyBadgeVisible =
  100 |       (await Promise.all(
  101 |         headerBadges.map((label) => page.getByText(new RegExp(`^${label}$`, 'i')).first().isVisible().catch(() => false)),
  102 |       )).some(Boolean);
  103 |     expect(anyBadgeVisible).toBeTruthy();
  104 | 
  105 |     const metadataLabels = [
  106 |       'Asset',
  107 |       'Asset Lead',
  108 |       'FSO Model',
  109 |       'Study Sponsor',
  110 |       'Designation',
  111 |       'Target Enrollment',
  112 |       'Planned FPI',
  113 |       'Actual FPI',
```