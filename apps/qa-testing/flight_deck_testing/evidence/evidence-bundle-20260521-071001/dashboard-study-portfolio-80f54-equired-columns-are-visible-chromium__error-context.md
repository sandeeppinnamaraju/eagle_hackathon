# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.js >> Study Portfolio Dashboard >> study overview navigation works and required columns are visible
- Location: tests\dashboard.spec.js:26:3

# Error details

```
Error: page.goto: net::ERR_INSUFFICIENT_RESOURCES at https://type-grand-assessed-tech.trycloudflare.com/
Call log:
  - navigating to "https://type-grand-assessed-tech.trycloudflare.com/", waiting until "load"

```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | const { EXPECTED_COLUMNS } = require('../fixtures/dashboardData');
  3   | 
  4   | test.describe('Study Portfolio Dashboard', () => {
  5   |   test.beforeEach(async ({ page }) => {
> 6   |     await page.goto('https://type-grand-assessed-tech.trycloudflare.com/');
      |                ^ Error: page.goto: net::ERR_INSUFFICIENT_RESOURCES at https://type-grand-assessed-tech.trycloudflare.com/
  7   |     await page.waitForLoadState('networkidle');
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
```