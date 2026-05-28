# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.js >> Study Portfolio Dashboard >> table toggle shows table with all required columns
- Location: tests\dashboard.spec.js:41:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('table, [role="table"]').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('table, [role="table"]').first()

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
  2   | const { EXPECTED_COLUMNS } = require('../fixtures/dashboardData');const { setupAuthenticatedStudyPortfolio, openStudyPortfolio } = require('../utils/authNavigation');
  3   | 
  4   | const BASE_URL = 'https://spend-mhz-bufing-characteristics.trycloudflare.com';
  5   | 
  6   | test.describe('Study Portfolio Dashboard', () => {
  7   |   test.describe.configure({ mode: 'serial', timeout: 90_000 });
  8   | 
  9   |   let context;
  10  |   let page;
  11  | 
  12  |   const DASHBOARD_HEADING = /Study Portfolio Dashboard|Portfolio Dashboard/i;
  13  | 
  14  |   const getSearchInput = () => page.locator('input[placeholder*="Search"], input[type="search"], input').first();
  15  | 
  16  |   const getEmptyStateIndicator = () =>
  17  |     page.getByText(/No Studies Found|No data|Showing\s+0\s+of\s+0\s+studies|0\s+of\s+0\s+studies|0\s+loaded/i).first();
  18  | 
  19  |   const getStudyLinks = () => page.locator('a[href*="/studies/"]');
  20  | 
  21  |   const openDashboard = async () => {
  22  |     await openStudyPortfolio(page, { baseUrl: BASE_URL });
  23  |     await page.waitForLoadState('networkidle').catch(() => {});
  24  |     await expect(page.getByRole('heading', { name: DASHBOARD_HEADING })).toBeVisible();
  25  |   };
  26  | 
  27  |   test.beforeAll(async ({ browser }) => {
  28  |     context = await browser.newContext();
  29  |     page = await context.newPage();
  30  |     await setupAuthenticatedStudyPortfolio(page, { baseUrl: BASE_URL });
  31  |   });
  32  | 
  33  |   test.beforeEach(async () => {
  34  |     await openDashboard();
  35  |   });
  36  | 
  37  |   test.afterAll(async () => {
  38  |     await context.close();
  39  |   });
  40  | 
  41  |   test('table toggle shows table with all required columns', async () => {
  42  |     await page.getByRole('button', { name: 'Table' }).first().click();
  43  | 
  44  |     const table = page.locator('table, [role="table"]').first();
> 45  |     await expect(table).toBeVisible();
      |                         ^ Error: expect(locator).toBeVisible() failed
  46  | 
  47  |     const tableHeaders = await page.locator('table thead th').allInnerTexts();
  48  |     const normalizedHeaders = tableHeaders.map((header) => header.replace(/\s+/g, ' ').trim().toLowerCase());
  49  | 
  50  |     for (const expectedColumn of EXPECTED_COLUMNS) {
  51  |       expect(normalizedHeaders).toContain(expectedColumn.toLowerCase());
  52  |       await expect(
  53  |         page
  54  |           .getByRole('columnheader', {
  55  |             name: new RegExp(`^${expectedColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  56  |           })
  57  |           .first()
  58  |       ).toBeVisible();
  59  |     }
  60  |   });
  61  | 
  62  |   test('search works without breaking', async () => {
  63  |     const search = page
  64  |       .getByPlaceholder('Search by ID, title...')
  65  |       .or(page.locator('input[placeholder*="Search"], input[type="search"], input').first())
  66  |       .first();
  67  | 
  68  |     await expect(search).toBeVisible();
  69  |     await search.fill('ST-2024-003');
  70  |     await search.press('Enter');
  71  | 
  72  |     const hasResults = (await page.getByRole('link', { name: /ST-\d{4}-\d{3}/ }).count()) > 0;
  73  |     if (!hasResults) {
  74  |       await expect(page.getByText(/No Studies Found|0 loaded/i).first()).toBeVisible();
  75  |     } else {
  76  |       await expect(page.getByRole('link', { name: /ST-\d{4}-\d{3}/ }).first()).toBeVisible();
  77  |     }
  78  |   });
  79  | 
  80  |   test('filters basic interaction does not break', async () => {
  81  |     const possibleFilters = ['Therapeutic Area', 'Phase', 'Study Status'];
  82  | 
  83  |     let interacted = false;
  84  |     for (const name of possibleFilters) {
  85  |       const filterBtn = page.getByRole('button', { name }).first();
  86  |       if (await filterBtn.isVisible().catch(() => false)) {
  87  |         await filterBtn.click();
  88  |         await expect(filterBtn).toBeVisible();
  89  |         interacted = true;
  90  |         break;
  91  |       }
  92  |     }
  93  | 
  94  |     expect(interacted).toBeTruthy();
  95  |   });
  96  | 
  97  |   test('sorting click works when header exists', async () => {
  98  |     await page.getByRole('button', { name: 'Table' }).first().click();
  99  |     const table = page.locator('table, [role="table"]').first();
  100 |     await expect(table).toBeVisible();
  101 | 
  102 |     const sortableInTable = table.getByRole('button', { name: /Study ID|Phase|Status/i }).first();
  103 |     const headerCellInTable = table.getByRole('columnheader', { name: /Study ID|Phase|Status/i }).first();
  104 | 
  105 |     const useButton = await sortableInTable.isVisible().catch(() => false);
  106 |     const target = useButton ? sortableInTable : headerCellInTable;
  107 | 
  108 |     await expect(target).toBeVisible();
  109 |     await target.click({ force: true });
  110 |     await expect(target).toBeVisible();
  111 |   });
  112 | 
  113 |   test('empty state handled safely', async () => {
  114 |     const search = page
  115 |       .getByPlaceholder('Search by ID, title...')
  116 |       .or(page.locator('input[placeholder*="Search"], input[type="search"], input').first())
  117 |       .first();
  118 | 
  119 |     await search.fill('ZZZZ-NO-DATA-999999');
  120 |     await search.press('Enter');
  121 | 
  122 |     const noData = page.getByText(/No Studies Found|No data/i).first();
  123 |     if (await noData.count()) {
  124 |       await expect(noData).toBeVisible();
  125 |     } else {
  126 |       await expect(page.getByText(/Showing\s+0\s+of\s+0\s+studies|0\s+of\s+0\s+studies|0\s+loaded|loaded/i).first()).toBeVisible();
  127 |     }
  128 |   });
  129 | 
  130 |   test('table view is visible and handles rows or empty state', async () => {
  131 |     const tableButton = page.getByRole('button', { name: 'Table' }).first();
  132 |     if (await tableButton.isVisible().catch(() => false)) {
  133 |       await tableButton.click();
  134 |       await page.waitForLoadState('networkidle').catch(() => {});
  135 |     }
  136 | 
  137 |     const table = page.locator('table, [role="table"]').first();
  138 |     await expect(table).toBeVisible();
  139 | 
  140 |     const rows = page.locator('table tbody tr, [role="rowgroup"] [role="row"]');
  141 |     const rowCount = await rows.count().catch(() => 0);
  142 | 
  143 |     if (rowCount > 0) {
  144 |       await expect(rows.first()).toBeVisible();
  145 |     } else {
```