# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.js >> Study Portfolio Dashboard >> table toggle shows table with all required columns
- Location: tests\dashboard.spec.js:59:3

# Error details

```
TypeError: loginViaUI is not a function
```

# Test source

```ts
  1   | const { test, expect } = require('../utils/stepTest');
  2   | const { EXPECTED_COLUMNS } = require('../fixtures/dashboardData');
  3   | const { loginViaUI } = require('../utils/authNavigation');
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
  25  |       await expect(loadingText).toBeHidden({ timeout: 30_000 });
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
  36  | 
  37  |   const openDashboard = async () => {
  38  |     await loginViaUI(page, { baseUrl: BASE_URL });
  39  |     await page.waitForLoadState('networkidle').catch(() => {});
  40  |     await expect(page.getByRole('heading', { name: DASHBOARD_HEADING })).toBeVisible();
  41  |   };
  42  | 
  43  | 
  44  |   test.beforeAll(async ({ browser }) => {
  45  |     test.setTimeout(120_000);
  46  |     context = await browser.newContext();
  47  |     page = await context.newPage();
> 48  |     await loginViaUI(page, { baseUrl: BASE_URL });
      |           ^ TypeError: loginViaUI is not a function
  49  |   });
  50  | 
  51  |   test.beforeEach(async () => {
  52  |     await openDashboard();
  53  |   });
  54  | 
  55  |   test.afterAll(async () => {
  56  |     await context.close();
  57  |   });
  58  | 
  59  |   test('table toggle shows table with all required columns', async () => {
  60  |     await openTableView();
  61  | 
  62  |     const table = page.locator('table, [role="table"]').first();
  63  |     if (!(await table.isVisible().catch(() => false))) {
  64  |       await expect(getEmptyStateIndicator()).toBeVisible();
  65  |       return;
  66  |     }
  67  | 
  68  |     const tableHeaders = await page.locator('table thead th').allInnerTexts();
  69  |     const normalizedHeaders = tableHeaders.map((header) => header.replace(/\s+/g, ' ').trim().toLowerCase());
  70  | 
  71  |     for (const expectedColumn of EXPECTED_COLUMNS) {
  72  |       expect(normalizedHeaders).toContain(expectedColumn.toLowerCase());
  73  |       await expect(
  74  |         page
  75  |           .getByRole('columnheader', {
  76  |             name: new RegExp(`^${expectedColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  77  |           })
  78  |           .first()
  79  |       ).toBeVisible();
  80  |     }
  81  |   });
  82  | 
  83  |   test('search works without breaking', async () => {
  84  |     const search = page
  85  |       .getByPlaceholder('Search by ID, title...')
  86  |       .or(page.locator('input[placeholder*="Search"], input[type="search"], input').first())
  87  |       .first();
  88  | 
  89  |     await expect(search).toBeVisible();
  90  |     await search.fill('ST-2024-003');
  91  |     await search.press('Enter');
  92  | 
  93  |     const hasResults = (await page.getByRole('link', { name: /ST-\d{4}-\d{3}/ }).count()) > 0;
  94  |     if (!hasResults) {
  95  |       await expect(page.getByText(/No Studies Found|0 loaded/i).first()).toBeVisible();
  96  |     } else {
  97  |       await expect(page.getByRole('link', { name: /ST-\d{4}-\d{3}/ }).first()).toBeVisible();
  98  |     }
  99  |   });
  100 | 
  101 |   test('filters basic interaction does not break', async () => {
  102 |     const possibleFilters = ['Therapeutic Area', 'Phase', 'Study Status'];
  103 | 
  104 |     let interacted = false;
  105 |     for (const name of possibleFilters) {
  106 |       const filterBtn = page.getByRole('button', { name }).first();
  107 |       if (await filterBtn.isVisible().catch(() => false)) {
  108 |         await filterBtn.click();
  109 |         await expect(filterBtn).toBeVisible();
  110 |         interacted = true;
  111 |         break;
  112 |       }
  113 |     }
  114 | 
  115 |     expect(interacted).toBeTruthy();
  116 |   });
  117 | 
  118 |   test('sorting click works when header exists', async () => {
  119 |     await openTableView();
  120 |     const table = page.locator('table, [role="table"]').first();
  121 |     if (!(await table.isVisible().catch(() => false))) {
  122 |       await expect(getEmptyStateIndicator()).toBeVisible();
  123 |       return;
  124 |     }
  125 | 
  126 |     const sortableInTable = table.getByRole('button', { name: /Study ID|Phase|Status/i }).first();
  127 |     const headerCellInTable = table.getByRole('columnheader', { name: /Study ID|Phase|Status/i }).first();
  128 | 
  129 |     const useButton = await sortableInTable.isVisible().catch(() => false);
  130 |     const target = useButton ? sortableInTable : headerCellInTable;
  131 | 
  132 |     if (!(await target.isVisible().catch(() => false))) {
  133 |       await expect(table).toBeVisible();
  134 |       return;
  135 |     }
  136 | 
  137 |     await target.click({ force: true });
  138 |     await expect(target).toBeVisible();
  139 |   });
  140 | 
  141 |   test('empty state handled safely', async () => {
  142 |     const search = page
  143 |       .getByPlaceholder('Search by ID, title...')
  144 |       .or(page.locator('input[placeholder*="Search"], input[type="search"], input').first())
  145 |       .first();
  146 | 
  147 |     await search.fill('ZZZZ-NO-DATA-999999');
  148 |     await search.press('Enter');
```