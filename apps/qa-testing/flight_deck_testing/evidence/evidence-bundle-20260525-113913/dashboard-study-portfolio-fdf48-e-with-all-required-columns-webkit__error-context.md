# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.js >> Study Portfolio Dashboard >> table toggle shows table with all required columns
- Location: tests\dashboard.spec.js:26:3

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
  4   | test.describe('Study Portfolio Dashboard', () => {
  5   |   test.describe.configure({ mode: 'serial' });
  6   | 
  7   |   let context;
  8   |   let page;
  9   | 
  10  |   const openDashboard = async () => {
  11  |     await page.goto('https://legislature-valued-short-facilitate.trycloudflare.com/');
  12  |     await page.waitForLoadState('networkidle');
> 13  |     await expect(page.getByRole('heading', { name: 'Portfolio Dashboard' })).toBeVisible();
      |                                                                              ^ Error: expect(locator).toBeVisible() failed
  14  |   };
  15  | 
  16  |   test.beforeAll(async ({ browser }) => {
  17  |     context = await browser.newContext();
  18  |     page = await context.newPage();
  19  |     await openDashboard();
  20  |   });
  21  | 
  22  |   test.afterAll(async () => {
  23  |     await context.close();
  24  |   });
  25  | 
  26  |   test('table toggle shows table with all required columns', async () => {
  27  |     await openDashboard();
  28  |     await page.getByRole('button', { name: 'Table' }).first().click();
  29  | 
  30  |     const table = page.locator('table, [role="table"]').first();
  31  |     await expect(table).toBeVisible();
  32  | 
  33  |     const tableHeaders = await page.locator('table thead th').allInnerTexts();
  34  |     const normalizedHeaders = tableHeaders.map((header) => header.replace(/\s+/g, ' ').trim().toLowerCase());
  35  | 
  36  |     for (const expectedColumn of EXPECTED_COLUMNS) {
  37  |       expect(normalizedHeaders).toContain(expectedColumn.toLowerCase());
  38  |       await expect(page.getByRole('columnheader', { name: new RegExp(`^${expectedColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).first()).toBeVisible();
  39  |     }
  40  |   });
  41  | 
  42  |   test('study overview navigation works and required columns are visible', async () => {
  43  |     await openDashboard();
  44  |     await page.getByRole('link', { name: 'Study Overview' }).first().click();
  45  |     await page.waitForLoadState('networkidle');
  46  | 
  47  |     await expect(page).toHaveURL(/\/studies\/?$/);
  48  |     await expect(page.getByRole('heading', { name: /Studies/i })).toBeVisible();
  49  | 
  50  |     const table = page.locator('table, [role="table"]').first();
  51  |     await expect(table).toBeVisible();
  52  | 
  53  |     const tableHeaders = await page.locator('table thead th').allInnerTexts();
  54  |     const normalizedHeaders = tableHeaders.map((header) => header.replace(/\s+/g, ' ').trim().toLowerCase());
  55  | 
  56  |     for (const expectedColumn of EXPECTED_COLUMNS) {
  57  |       expect(normalizedHeaders).toContain(expectedColumn.toLowerCase());
  58  |       await expect(page.getByRole('columnheader', { name: new RegExp(`^${expectedColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).first()).toBeVisible();
  59  |     }
  60  |   });
  61  | 
  62  |   test('search works without breaking', async () => {
  63  |     await openDashboard();
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
  82  |     await openDashboard();
  83  |     const possibleFilters = ['Therapeutic Area', 'Phase', 'Study Status'];
  84  | 
  85  |     for (const name of possibleFilters) {
  86  |       const filterBtn = page.getByRole('button', { name }).first();
  87  |       if ((await filterBtn.count()) > 0) {
  88  |         await filterBtn.click();
  89  |         await expect(filterBtn).toBeVisible();
  90  |         break;
  91  |       }
  92  |     }
  93  | 
  94  |     expect(true).toBeTruthy();
  95  |   });
  96  | 
  97  |   test('sorting click works when header exists', async () => {
  98  |     await openDashboard();
  99  |     await page.getByRole('button', { name: 'Table' }).first().click();
  100 |     const table = page.locator('table, [role="table"]').first();
  101 |     await expect(table).toBeVisible();
  102 | 
  103 |     const sortableInTable = table.getByRole('button', { name: /Study ID|Phase|Status/i }).first();
  104 |     const headerCellInTable = table.getByRole('columnheader', { name: /Study ID|Phase|Status/i }).first();
  105 | 
  106 |     if ((await sortableInTable.count()) > 0) {
  107 |       await expect(sortableInTable).toBeVisible();
  108 |       await sortableInTable.click({ force: true });
  109 |       await expect(sortableInTable).toBeVisible();
  110 |       return;
  111 |     }
  112 | 
  113 |     if ((await headerCellInTable.count()) > 0) {
```