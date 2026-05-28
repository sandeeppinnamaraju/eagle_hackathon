# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.js >> Study Portfolio Dashboard >> table toggle shows table with all required columns
- Location: tests\dashboard.spec.js:42:3

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
  2   | const { EXPECTED_COLUMNS } = require('../fixtures/dashboardData');
  3   | const { setupAuthenticatedStudyPortfolio, openStudyPortfolio } = require('../utils/authNavigation');
  4   | 
  5   | const BASE_URL = 'https://spend-mhz-bufing-characteristics.trycloudflare.com';
  6   | 
  7   | test.describe('Study Portfolio Dashboard', () => {
  8   |   test.describe.configure({ mode: 'serial', timeout: 90_000 });
  9   | 
  10  |   let context;
  11  |   let page;
  12  | 
  13  |   const DASHBOARD_HEADING = /Study Portfolio Dashboard|Portfolio Dashboard/i;
  14  | 
  15  |   const getSearchInput = () => page.locator('input[placeholder*="Search"], input[type="search"], input').first();
  16  | 
  17  |   const getEmptyStateIndicator = () =>
  18  |     page.getByText(/No Studies Found|No data|Showing\s+0\s+of\s+0\s+studies|0\s+of\s+0\s+studies|0\s+loaded/i).first();
  19  | 
  20  |   const getStudyLinks = () => page.locator('a[href*="/studies/"]');
  21  | 
  22  |   const openDashboard = async () => {
  23  |     await openStudyPortfolio(page, { baseUrl: BASE_URL });
  24  |     await page.waitForLoadState('networkidle').catch(() => {});
  25  |     await expect(page.getByRole('heading', { name: DASHBOARD_HEADING })).toBeVisible();
  26  |   };
  27  | 
  28  |   test.beforeAll(async ({ browser }) => {
  29  |     context = await browser.newContext();
  30  |     page = await context.newPage();
  31  |     await setupAuthenticatedStudyPortfolio(page, { baseUrl: BASE_URL });
  32  |   });
  33  | 
  34  |   test.beforeEach(async () => {
  35  |     await openDashboard();
  36  |   });
  37  | 
  38  |   test.afterAll(async () => {
  39  |     await context.close();
  40  |   });
  41  | 
  42  |   test('table toggle shows table with all required columns', async () => {
  43  |     await page.getByRole('button', { name: 'Table' }).first().click();
  44  | 
  45  |     const table = page.locator('table, [role="table"]').first();
> 46  |     await expect(table).toBeVisible();
      |                         ^ Error: expect(locator).toBeVisible() failed
  47  | 
  48  |     const tableHeaders = await page.locator('table thead th').allInnerTexts();
  49  |     const normalizedHeaders = tableHeaders.map((header) => header.replace(/\s+/g, ' ').trim().toLowerCase());
  50  | 
  51  |     for (const expectedColumn of EXPECTED_COLUMNS) {
  52  |       expect(normalizedHeaders).toContain(expectedColumn.toLowerCase());
  53  |       await expect(
  54  |         page
  55  |           .getByRole('columnheader', {
  56  |             name: new RegExp(`^${expectedColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  57  |           })
  58  |           .first()
  59  |       ).toBeVisible();
  60  |     }
  61  |   });
  62  | 
  63  |   test('search works without breaking', async () => {
  64  |     const search = page
  65  |       .getByPlaceholder('Search by ID, title...')
  66  |       .or(page.locator('input[placeholder*="Search"], input[type="search"], input').first())
  67  |       .first();
  68  | 
  69  |     await expect(search).toBeVisible();
  70  |     await search.fill('ST-2024-003');
  71  |     await search.press('Enter');
  72  | 
  73  |     const hasResults = (await page.getByRole('link', { name: /ST-\d{4}-\d{3}/ }).count()) > 0;
  74  |     if (!hasResults) {
  75  |       await expect(page.getByText(/No Studies Found|0 loaded/i).first()).toBeVisible();
  76  |     } else {
  77  |       await expect(page.getByRole('link', { name: /ST-\d{4}-\d{3}/ }).first()).toBeVisible();
  78  |     }
  79  |   });
  80  | 
  81  |   test('filters basic interaction does not break', async () => {
  82  |     const possibleFilters = ['Therapeutic Area', 'Phase', 'Study Status'];
  83  | 
  84  |     let interacted = false;
  85  |     for (const name of possibleFilters) {
  86  |       const filterBtn = page.getByRole('button', { name }).first();
  87  |       if (await filterBtn.isVisible().catch(() => false)) {
  88  |         await filterBtn.click();
  89  |         await expect(filterBtn).toBeVisible();
  90  |         interacted = true;
  91  |         break;
  92  |       }
  93  |     }
  94  | 
  95  |     expect(interacted).toBeTruthy();
  96  |   });
  97  | 
  98  |   test('sorting click works when header exists', async () => {
  99  |     await page.getByRole('button', { name: 'Table' }).first().click();
  100 |     const table = page.locator('table, [role="table"]').first();
  101 |     await expect(table).toBeVisible();
  102 | 
  103 |     const sortableInTable = table.getByRole('button', { name: /Study ID|Phase|Status/i }).first();
  104 |     const headerCellInTable = table.getByRole('columnheader', { name: /Study ID|Phase|Status/i }).first();
  105 | 
  106 |     const useButton = await sortableInTable.isVisible().catch(() => false);
  107 |     const target = useButton ? sortableInTable : headerCellInTable;
  108 | 
  109 |     await expect(target).toBeVisible();
  110 |     await target.click({ force: true });
  111 |     await expect(target).toBeVisible();
  112 |   });
  113 | 
  114 |   test('empty state handled safely', async () => {
  115 |     const search = page
  116 |       .getByPlaceholder('Search by ID, title...')
  117 |       .or(page.locator('input[placeholder*="Search"], input[type="search"], input').first())
  118 |       .first();
  119 | 
  120 |     await search.fill('ZZZZ-NO-DATA-999999');
  121 |     await search.press('Enter');
  122 | 
  123 |     const noData = page.getByText(/No Studies Found|No data/i).first();
  124 |     if (await noData.count()) {
  125 |       await expect(noData).toBeVisible();
  126 |     } else {
  127 |       await expect(page.getByText(/Showing\s+0\s+of\s+0\s+studies|0\s+of\s+0\s+studies|0\s+loaded|loaded/i).first()).toBeVisible();
  128 |     }
  129 |   });
  130 | 
  131 |   test('table view is visible and handles rows or empty state', async () => {
  132 |     const tableButton = page.getByRole('button', { name: 'Table' }).first();
  133 |     if (await tableButton.isVisible().catch(() => false)) {
  134 |       await tableButton.click();
  135 |       await page.waitForLoadState('networkidle').catch(() => {});
  136 |     }
  137 | 
  138 |     const table = page.locator('table, [role="table"]').first();
  139 |     await expect(table).toBeVisible();
  140 | 
  141 |     const rows = page.locator('table tbody tr, [role="rowgroup"] [role="row"]');
  142 |     const rowCount = await rows.count().catch(() => 0);
  143 | 
  144 |     if (rowCount > 0) {
  145 |       await expect(rows.first()).toBeVisible();
  146 |     } else {
```