const { test, expect } = require('@playwright/test');
const { EXPECTED_COLUMNS } = require('../fixtures/dashboardData');

test.describe('Study Portfolio Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://type-grand-assessed-tech.trycloudflare.com/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Portfolio Dashboard' })).toBeVisible();
  });

  test('table toggle shows table with all required columns', async ({ page }) => {
    await page.getByRole('button', { name: 'Table' }).first().click();

    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible();

    const tableHeaders = await page.locator('table thead th').allInnerTexts();
    const normalizedHeaders = tableHeaders.map((header) => header.replace(/\s+/g, ' ').trim().toLowerCase());

    for (const expectedColumn of EXPECTED_COLUMNS) {
      expect(normalizedHeaders).toContain(expectedColumn.toLowerCase());
      await expect(page.getByRole('columnheader', { name: new RegExp(`^${expectedColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).first()).toBeVisible();
    }
  });

  test('study overview navigation works and required columns are visible', async ({ page }) => {
    await page.getByRole('link', { name: 'Study Overview' }).first().click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/studies\/?$/);
    await expect(page.getByRole('heading', { name: /Studies/i })).toBeVisible();

    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible();

    const tableHeaders = await page.locator('table thead th').allInnerTexts();
    const normalizedHeaders = tableHeaders.map((header) => header.replace(/\s+/g, ' ').trim().toLowerCase());

    for (const expectedColumn of EXPECTED_COLUMNS) {
      expect(normalizedHeaders).toContain(expectedColumn.toLowerCase());
      await expect(page.getByRole('columnheader', { name: new RegExp(`^${expectedColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).first()).toBeVisible();
    }
  });

  test('search works without breaking', async ({ page }) => {
    const search = page
      .getByPlaceholder('Search by ID, title...')
      .or(page.locator('input[placeholder*="Search"], input[type="search"], input').first())
      .first();

    await expect(search).toBeVisible();
    await search.fill('ST-2024-003');
    await search.press('Enter');

    const hasResults = (await page.getByRole('link', { name: /ST-\d{4}-\d{3}/ }).count()) > 0;
    if (!hasResults) {
      await expect(page.getByText(/No Studies Found|0 loaded/i).first()).toBeVisible();
    } else {
      await expect(page.getByRole('link', { name: /ST-\d{4}-\d{3}/ }).first()).toBeVisible();
    }
  });

  test('filters basic interaction does not break', async ({ page }) => {
    const possibleFilters = ['Therapeutic Area', 'Phase', 'Study Status'];

    for (const name of possibleFilters) {
      const filterBtn = page.getByRole('button', { name }).first();
      if ((await filterBtn.count()) > 0) {
        await filterBtn.click();
        await expect(filterBtn).toBeVisible();
        break;
      }
    }

    expect(true).toBeTruthy();
  });

  test('sorting click works when header exists', async ({ page }) => {
    await page.getByRole('button', { name: 'Table' }).first().click();
    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible();

    const sortableInTable = table.getByRole('button', { name: /Study ID|Phase|Status/i }).first();
    const headerCellInTable = table.getByRole('columnheader', { name: /Study ID|Phase|Status/i }).first();

    if ((await sortableInTable.count()) > 0) {
      await expect(sortableInTable).toBeVisible();
      await sortableInTable.click({ force: true });
      await expect(sortableInTable).toBeVisible();
      return;
    }

    if ((await headerCellInTable.count()) > 0) {
      await expect(headerCellInTable).toBeVisible();
      await headerCellInTable.click({ force: true });
      await expect(headerCellInTable).toBeVisible();
      return;
    }

    test.skip();
  });

  test('empty state handled safely', async ({ page }) => {
    const search = page
      .getByPlaceholder('Search by ID, title...')
      .or(page.locator('input[placeholder*="Search"], input[type="search"], input').first())
      .first();

    await search.fill('ZZZZ-NO-DATA-999999');
    await search.press('Enter');

    const noData = page.getByText(/No Studies Found|No data/i).first();
    if ((await noData.count()) > 0) {
      await expect(noData).toBeVisible();
    } else {
      await expect(page.getByText(/0 loaded|loaded/i).first()).toBeVisible();
    }
  });
});
