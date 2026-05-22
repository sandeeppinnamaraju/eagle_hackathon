# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.js >> Study Portfolio Dashboard >> sorting click works when header exists
- Location: tests\dashboard.spec.js:78:3

# Error details

```
TimeoutError: page.waitForLoadState: Timeout 30000ms exceeded.
=========================== logs ===========================
  "commit" event fired
  "domcontentloaded" event fired
  "load" event fired
============================================================
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e4]:
      - link "Flight Deck" [ref=e5] [cursor=pointer]:
        - /url: /
      - navigation [ref=e6]:
        - link "Study Portfolio" [ref=e7] [cursor=pointer]:
          - /url: /
        - link "Study Overview" [ref=e8] [cursor=pointer]:
          - /url: /studies
        - link "Protocol Search" [ref=e9] [cursor=pointer]:
          - /url: /protocol-search
  - main [ref=e12]:
    - status [ref=e13]: Error loading studies
    - heading "Portfolio Dashboard" [level=1] [ref=e15]
    - alert [ref=e16]: Something went wrong. Please try again later.
    - generic [ref=e18]:
      - generic [ref=e19]:
        - generic [ref=e20]:
          - img
          - textbox "Search by ID, title..." [ref=e21]
        - paragraph [ref=e22]: 0 loaded • 0 total
      - generic [ref=e23]:
        - button "Therapeutic Area" [ref=e24]:
          - text: Therapeutic Area
          - img [ref=e25]
        - button "Phase" [ref=e27]:
          - text: Phase
          - img [ref=e28]
        - button "Study Status" [ref=e30]:
          - text: Study Status
          - img [ref=e31]
        - button "Portfolio" [ref=e33]:
          - text: Portfolio
          - img [ref=e34]
        - button "Program" [ref=e36]:
          - text: Program
          - img [ref=e37]
        - button "Region" [ref=e39]:
          - text: Region
          - img [ref=e40]
        - button "FPI / LPO" [ref=e42]:
          - img [ref=e43]
          - text: FPI / LPO
          - img [ref=e45]
    - generic [ref=e47]:
      - generic [ref=e48]:
        - generic [ref=e49]:
          - paragraph [ref=e50]: Active Studies
          - generic [ref=e51]:
            - img [ref=e52]
            - img [ref=e55]
        - paragraph [ref=e58]: "30"
        - paragraph [ref=e59]: recruiting or follow-up
      - generic [ref=e60]:
        - generic [ref=e61]:
          - paragraph [ref=e62]: On Track
          - generic [ref=e63]:
            - img [ref=e64]
            - img [ref=e67]
        - paragraph [ref=e70]: 26.7%
        - paragraph [ref=e71]: 8 of 30 active
      - generic [ref=e72]:
        - generic [ref=e73]:
          - paragraph [ref=e74]: At Risk / Off Track
          - generic [ref=e75]:
            - img [ref=e76]
            - img [ref=e79]
        - paragraph [ref=e82]: 73.3%
        - paragraph [ref=e83]: 22 of 30 active
      - generic [ref=e84]:
        - generic [ref=e85]:
          - paragraph [ref=e86]: Enrollment vs Target
          - generic [ref=e87]:
            - img [ref=e88]
            - img [ref=e91]
        - paragraph [ref=e94]: 16.1%
        - paragraph [ref=e95]: 12,788 of 79,273 patients
        - img [ref=e96]
      - generic [ref=e98]:
        - generic [ref=e99]:
          - paragraph [ref=e100]: Schedule Adherence
          - generic [ref=e101]:
            - img [ref=e102]
            - img [ref=e105]
        - paragraph [ref=e108]: 90.1%
        - paragraph [ref=e109]: 12,416 of 13,782 planned
      - generic [ref=e110]:
        - generic [ref=e111]:
          - paragraph [ref=e112]: Velocity vs Plan
          - generic [ref=e113]:
            - img [ref=e114]
            - img [ref=e117]
        - paragraph [ref=e120]: 85.2%
        - paragraph [ref=e121]: avg enrollment speed
    - generic [ref=e123]:
      - button "Cards" [ref=e124]:
        - img [ref=e125]
        - text: Cards
      - button "Table" [ref=e130]:
        - img [ref=e131]
        - text: Table
```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | const { EXPECTED_COLUMNS } = require('../fixtures/dashboardData');
  3   | 
  4   | test.describe('Study Portfolio Dashboard', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto('https://stainless-steven-exclusion-material.trycloudflare.com/');
> 7   |     await page.waitForLoadState('networkidle');
      |                ^ TimeoutError: page.waitForLoadState: Timeout 30000ms exceeded.
  8   |     await expect(page.getByRole('heading', { name: 'Portfolio Dashboard' })).toBeVisible();
  9   |   });
  10  | 
  11  |   test('table toggle shows table with all required columns', async ({ page }) => {
  12  |     await page.getByRole('button', { name: 'Table' }).first().click();
  13  | 
  14  |     const table = page.locator('table, [role="table"]').first();
  15  |     await expect(table).toBeVisible();
  16  | 
  17  |     const tableHeaders = await page.locator('table thead th').allInnerTexts();
  18  |     const normalizedHeaders = tableHeaders.map((header) => header.replace(/\s+/g, ' ').trim().toLowerCase());
  19  | 
  20  |     for (const expectedColumn of EXPECTED_COLUMNS) {
  21  |       expect(normalizedHeaders).toContain(expectedColumn.toLowerCase());
  22  |       await expect(page.getByRole('columnheader', { name: new RegExp(`^${expectedColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).first()).toBeVisible();
  23  |     }
  24  |   });
  25  | 
  26  |   test('study overview navigation works and required columns are visible', async ({ page }) => {
  27  |     await page.getByRole('link', { name: 'Study Overview' }).first().click();
  28  |     await page.waitForLoadState('networkidle');
  29  | 
  30  |     await expect(page).toHaveURL(/\/studies\/?$/);
  31  |     await expect(page.getByRole('heading', { name: /Studies/i })).toBeVisible();
  32  | 
  33  |     const table = page.locator('table, [role="table"]').first();
  34  |     await expect(table).toBeVisible();
  35  | 
  36  |     const tableHeaders = await page.locator('table thead th').allInnerTexts();
  37  |     const normalizedHeaders = tableHeaders.map((header) => header.replace(/\s+/g, ' ').trim().toLowerCase());
  38  | 
  39  |     for (const expectedColumn of EXPECTED_COLUMNS) {
  40  |       expect(normalizedHeaders).toContain(expectedColumn.toLowerCase());
  41  |       await expect(page.getByRole('columnheader', { name: new RegExp(`^${expectedColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).first()).toBeVisible();
  42  |     }
  43  |   });
  44  | 
  45  |   test('search works without breaking', async ({ page }) => {
  46  |     const search = page
  47  |       .getByPlaceholder('Search by ID, title...')
  48  |       .or(page.locator('input[placeholder*="Search"], input[type="search"], input').first())
  49  |       .first();
  50  | 
  51  |     await expect(search).toBeVisible();
  52  |     await search.fill('ST-2024-003');
  53  |     await search.press('Enter');
  54  | 
  55  |     const hasResults = (await page.getByRole('link', { name: /ST-\d{4}-\d{3}/ }).count()) > 0;
  56  |     if (!hasResults) {
  57  |       await expect(page.getByText(/No Studies Found|0 loaded/i).first()).toBeVisible();
  58  |     } else {
  59  |       await expect(page.getByRole('link', { name: /ST-\d{4}-\d{3}/ }).first()).toBeVisible();
  60  |     }
  61  |   });
  62  | 
  63  |   test('filters basic interaction does not break', async ({ page }) => {
  64  |     const possibleFilters = ['Therapeutic Area', 'Phase', 'Study Status'];
  65  | 
  66  |     for (const name of possibleFilters) {
  67  |       const filterBtn = page.getByRole('button', { name }).first();
  68  |       if ((await filterBtn.count()) > 0) {
  69  |         await filterBtn.click();
  70  |         await expect(filterBtn).toBeVisible();
  71  |         break;
  72  |       }
  73  |     }
  74  | 
  75  |     expect(true).toBeTruthy();
  76  |   });
  77  | 
  78  |   test('sorting click works when header exists', async ({ page }) => {
  79  |     await page.getByRole('button', { name: 'Table' }).first().click();
  80  |     const table = page.locator('table, [role="table"]').first();
  81  |     await expect(table).toBeVisible();
  82  | 
  83  |     const sortableInTable = table.getByRole('button', { name: /Study ID|Phase|Status/i }).first();
  84  |     const headerCellInTable = table.getByRole('columnheader', { name: /Study ID|Phase|Status/i }).first();
  85  | 
  86  |     if ((await sortableInTable.count()) > 0) {
  87  |       await expect(sortableInTable).toBeVisible();
  88  |       await sortableInTable.click({ force: true });
  89  |       await expect(sortableInTable).toBeVisible();
  90  |       return;
  91  |     }
  92  | 
  93  |     if ((await headerCellInTable.count()) > 0) {
  94  |       await expect(headerCellInTable).toBeVisible();
  95  |       await headerCellInTable.click({ force: true });
  96  |       await expect(headerCellInTable).toBeVisible();
  97  |       return;
  98  |     }
  99  | 
  100 |     test.skip();
  101 |   });
  102 | 
  103 |   test('empty state handled safely', async ({ page }) => {
  104 |     const search = page
  105 |       .getByPlaceholder('Search by ID, title...')
  106 |       .or(page.locator('input[placeholder*="Search"], input[type="search"], input').first())
  107 |       .first();
```