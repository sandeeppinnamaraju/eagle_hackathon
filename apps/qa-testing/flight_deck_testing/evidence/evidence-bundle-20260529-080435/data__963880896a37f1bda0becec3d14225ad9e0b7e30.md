# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.js >> Study Portfolio Dashboard >> table toggle shows table with all required columns
- Location: tests\dashboard.spec.js:57:3

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
    63 × locator resolved to <div class="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">Loading studies...</div>
       - unexpected value "visible"

```

```yaml
- text: Loading studies...
```

# Test source

```ts
  1   | const { test, expect } = require('../utils/stepTest');
  2   | const { EXPECTED_COLUMNS } = require('../fixtures/dashboardData');
  3   | const { setupAuthenticatedStudyPortfolio, openStudyPortfolio } = require('../utils/authNavigation');
  4   | 
  5   | const BASE_URL = 'https://eagle-frontend01-hpe9hhhngdc9addx.centralus-01.azurewebsites.net/'; // username: eagle_user1, password: FD_hack@user1
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
  22  |   const waitForStudiesToSettle = async () => {
  23  |     const loadingText = page.getByText(/Loading studies\.\.\./i).first();
  24  |     if (await loadingText.isVisible().catch(() => false)) {
> 25  |       await expect(loadingText).toBeHidden({ timeout: 30_000 });
      |                                 ^ Error: expect(locator).toBeHidden() failed
  26  |     }
  27  |   };
  28  | 
  29  |   const openTableView = async () => {
  30  |     const tableButton = page.getByRole('button', { name: 'Table' }).first();
  31  |     await expect(tableButton).toBeVisible();
  32  |     await tableButton.click();
  33  |     await waitForStudiesToSettle();
  34  |   };
  35  | 
  36  |   const openDashboard = async () => {
  37  |     await openStudyPortfolio(page, { baseUrl: BASE_URL });
  38  |     await page.waitForLoadState('networkidle').catch(() => {});
  39  |     await expect(page.getByRole('heading', { name: DASHBOARD_HEADING })).toBeVisible();
  40  |   };
  41  | 
  42  |   test.beforeAll(async ({ browser }) => {
  43  |     test.setTimeout(120_000);
  44  |     context = await browser.newContext();
  45  |     page = await context.newPage();
  46  |     await setupAuthenticatedStudyPortfolio(page, { baseUrl: BASE_URL });
  47  |   });
  48  | 
  49  |   test.beforeEach(async () => {
  50  |     await openDashboard();
  51  |   });
  52  | 
  53  |   test.afterAll(async () => {
  54  |     await context.close();
  55  |   });
  56  | 
  57  |   test('table toggle shows table with all required columns', async () => {
  58  |     await openTableView();
  59  | 
  60  |     const table = page.locator('table, [role="table"]').first();
  61  |     if (!(await table.isVisible().catch(() => false))) {
  62  |       await expect(getEmptyStateIndicator()).toBeVisible();
  63  |       return;
  64  |     }
  65  | 
  66  |     const tableHeaders = await page.locator('table thead th').allInnerTexts();
  67  |     const normalizedHeaders = tableHeaders.map((header) => header.replace(/\s+/g, ' ').trim().toLowerCase());
  68  | 
  69  |     for (const expectedColumn of EXPECTED_COLUMNS) {
  70  |       expect(normalizedHeaders).toContain(expectedColumn.toLowerCase());
  71  |       await expect(
  72  |         page
  73  |           .getByRole('columnheader', {
  74  |             name: new RegExp(`^${expectedColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  75  |           })
  76  |           .first()
  77  |       ).toBeVisible();
  78  |     }
  79  |   });
  80  | 
  81  |   test('search works without breaking', async () => {
  82  |     const search = page
  83  |       .getByPlaceholder('Search by ID, title...')
  84  |       .or(page.locator('input[placeholder*="Search"], input[type="search"], input').first())
  85  |       .first();
  86  | 
  87  |     await expect(search).toBeVisible();
  88  |     await search.fill('ST-2024-003');
  89  |     await search.press('Enter');
  90  | 
  91  |     const hasResults = (await page.getByRole('link', { name: /ST-\d{4}-\d{3}/ }).count()) > 0;
  92  |     if (!hasResults) {
  93  |       await expect(page.getByText(/No Studies Found|0 loaded/i).first()).toBeVisible();
  94  |     } else {
  95  |       await expect(page.getByRole('link', { name: /ST-\d{4}-\d{3}/ }).first()).toBeVisible();
  96  |     }
  97  |   });
  98  | 
  99  |   test('filters basic interaction does not break', async () => {
  100 |     const possibleFilters = ['Therapeutic Area', 'Phase', 'Study Status'];
  101 | 
  102 |     let interacted = false;
  103 |     for (const name of possibleFilters) {
  104 |       const filterBtn = page.getByRole('button', { name }).first();
  105 |       if (await filterBtn.isVisible().catch(() => false)) {
  106 |         await filterBtn.click();
  107 |         await expect(filterBtn).toBeVisible();
  108 |         interacted = true;
  109 |         break;
  110 |       }
  111 |     }
  112 | 
  113 |     expect(interacted).toBeTruthy();
  114 |   });
  115 | 
  116 |   test('sorting click works when header exists', async () => {
  117 |     await openTableView();
  118 |     const table = page.locator('table, [role="table"]').first();
  119 |     if (!(await table.isVisible().catch(() => false))) {
  120 |       await expect(getEmptyStateIndicator()).toBeVisible();
  121 |       return;
  122 |     }
  123 | 
  124 |     const sortableInTable = table.getByRole('button', { name: /Study ID|Phase|Status/i }).first();
  125 |     const headerCellInTable = table.getByRole('columnheader', { name: /Study ID|Phase|Status/i }).first();
```