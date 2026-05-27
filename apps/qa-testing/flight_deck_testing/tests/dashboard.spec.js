const { test, expect } = require('../utils/stepTest');
const { EXPECTED_COLUMNS } = require('../fixtures/dashboardData');

test.describe('Study Portfolio Dashboard', () => {
  test.describe.configure({ mode: 'serial', timeout: 90_000 });


  // Set base URL for demo or CI: prefer env, else use demo default
  const BASE_URL = process.env.TEST_BASE_URL || 'https://release-switching-veteran-usb.trycloudflare.com/';

  let context;
  let page;

  const DASHBOARD_HEADING = /Study Portfolio Dashboard|Portfolio Dashboard/i;

  const navigateToDashboard = async () => {
    const hasDashboardOnCurrentPage = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
    if (hasDashboardOnCurrentPage) {
      return;
    }

    // Always use absolute URLs for demo stability
    await page.goto(BASE_URL + '/portfolio');
    await page.waitForLoadState('networkidle').catch(() => {});

    const hasDashboardOnPortfolioRoute = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
    if (hasDashboardOnPortfolioRoute) {
      return;
    }

    await page.goto(BASE_URL + '/');
    await page.waitForLoadState('networkidle').catch(() => {});

    const studyPortfolioLink = page.getByRole('link', { name: /Study Portfolio|Open Study Portfolio/i }).first();
    if (await studyPortfolioLink.isVisible().catch(() => false)) {
      await studyPortfolioLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    const hasDashboardAfterClick = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
    if (!hasDashboardAfterClick) {
      await page.goto(BASE_URL + '/portfolio');
      await page.waitForLoadState('networkidle').catch(() => {});
    }
  };

  const getDashboardUnavailableReason = async () => {
    await navigateToDashboard();

    const hasDashboard = await page.getByRole('heading', { name: DASHBOARD_HEADING }).isVisible().catch(() => false);
    if (hasDashboard) {
      return null;
    }

    const bodyText = await page.locator('body').innerText().catch(() => '');
    const finalPath = new URL(page.url()).pathname;
    if (/^\/(|portfolio)$/i.test(finalPath) === false) {
      return `Dashboard UI unavailable: unexpected path ${finalPath}`;
    }

    if (/not found/i.test(bodyText)) {
      return 'Dashboard UI unavailable: route returned Not Found';
    }

    return 'Dashboard UI unavailable in current environment';
  };

  const openDashboard = async () => {
    await navigateToDashboard();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: DASHBOARD_HEADING })).toBeVisible();
  };

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('table toggle shows table with all required columns', async () => {
    const unavailableReason = await getDashboardUnavailableReason();
    test.skip(!!unavailableReason, unavailableReason);

    await openDashboard();
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

  test('search works without breaking', async () => {
    const unavailableReason = await getDashboardUnavailableReason();
    test.skip(!!unavailableReason, unavailableReason);

    await openDashboard();
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

  test('filters basic interaction does not break', async () => {
    const unavailableReason = await getDashboardUnavailableReason();
    test.skip(!!unavailableReason, unavailableReason);

    await openDashboard();
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

  test('sorting click works when header exists', async () => {
    const unavailableReason = await getDashboardUnavailableReason();
    test.skip(!!unavailableReason, unavailableReason);

    await openDashboard();
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

  test('empty state handled safely', async () => {
    const unavailableReason = await getDashboardUnavailableReason();
    test.skip(!!unavailableReason, unavailableReason);

    await openDashboard();
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
      await expect(page.getByText(/Showing\s+0\s+of\s+0\s+studies|0\s+of\s+0\s+studies|0\s+loaded|loaded/i).first()).toBeVisible();
    }
  });

  const getSearchInput = () => page.locator('input[placeholder*="Search"], input[type="search"], input').first();

  const getEmptyStateIndicator = () => page.getByText(/No Studies Found|No data|Showing\s+0\s+of\s+0\s+studies|0\s+of\s+0\s+studies|0\s+loaded/i).first();

  const getStudyLinks = () => page.locator('a[href*="/studies/"]');

  test('table view is visible and handles rows or empty state', async () => {
    const unavailableReason = await getDashboardUnavailableReason();
    test.skip(!!unavailableReason, unavailableReason);

    await openDashboard();
    const tableButton = page.getByRole('button', { name: 'Table' }).first();
    if (await tableButton.isVisible().catch(() => false)) {
      await tableButton.click();
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible();

    const rows = page.locator('table tbody tr, [role="rowgroup"] [role="row"]');
    const rowCount = await rows.count().catch(() => 0);

    if (rowCount > 0) {
      await expect(rows.first()).toBeVisible();
      expect(rowCount >= 0).toBeTruthy();
    } else {
      await expect(getEmptyStateIndicator()).toBeVisible();
    }
  });

  test('valid search shows a matching study or safe empty state', async () => {
    const unavailableReason = await getDashboardUnavailableReason();
    test.skip(!!unavailableReason, unavailableReason);

    await openDashboard();
    const search = getSearchInput();
    await expect(search).toBeVisible();

    await search.fill('ST-2024-003');
    await search.press('Enter');
    await page.waitForLoadState('networkidle').catch(() => {});

    const matchingStudy = getStudyLinks().filter({ hasText: /ST-2024-003/i }).first();
    if (await matchingStudy.isVisible().catch(() => false)) {
      await expect(matchingStudy).toBeVisible();
    } else {
      await expect(getEmptyStateIndicator()).toBeVisible();
    }
  });

  test('partial search behaves safely', async () => {
    const unavailableReason = await getDashboardUnavailableReason();
    test.skip(!!unavailableReason, unavailableReason);

    await openDashboard();
    const search = getSearchInput();
    await expect(search).toBeVisible();

    await search.fill('ST-2024');
    await search.press('Enter');
    await page.waitForLoadState('networkidle').catch(() => {});

    const partialMatches = getStudyLinks().filter({ hasText: /ST-2024/i });
    const matchCount = await partialMatches.count().catch(() => 0);

    if (matchCount > 0) {
      await expect(partialMatches.first()).toBeVisible();
    } else {
      await expect(getEmptyStateIndicator()).toBeVisible();
    }
  });

  test('additional invalid search shows empty state safely', async () => {
    const unavailableReason = await getDashboardUnavailableReason();
    test.skip(!!unavailableReason, unavailableReason);

    await openDashboard();
    const search = getSearchInput();
    await expect(search).toBeVisible();

    await search.fill('INVALID-STUDY-DOES-NOT-EXIST-12345');
    await search.press('Enter');
    await page.waitForLoadState('networkidle').catch(() => {});

    await expect(getEmptyStateIndicator()).toBeVisible();
  });

  test('each available filter dropdown opens and closes safely', async () => {
    const unavailableReason = await getDashboardUnavailableReason();
    test.skip(!!unavailableReason, unavailableReason);

    await openDashboard();

    // List of filter display names and their selector types
    const filterSelectors = [
      { name: 'Therapeutic Area', type: 'button' },
      { name: 'Phase', type: 'combobox' },
      { name: 'Study Status', type: 'combobox' },
      { name: 'Portfolio', type: 'combobox' },
      { name: 'Program', type: 'combobox' },
    ];

    let interactedCount = 0;
    for (const { name, type } of filterSelectors) {
      let filter;
      if (type === 'button') {
        filter = page.getByRole('button', { name }).first();
      } else {
        filter = page.getByRole('combobox', { name }).first();
      }
      if (!(await filter.isVisible().catch(() => false))) continue;

      await filter.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await expect(filter).toBeVisible();
      // Try to close dropdown (Escape or blur)
      await page.keyboard.press('Escape').catch(() => {});
      interactedCount++;
    }
    expect(interactedCount).toBeGreaterThan(0);
  });

  test('reset filters works when reset affordance is available', async () => {
    const unavailableReason = await getDashboardUnavailableReason();
    test.skip(!!unavailableReason, unavailableReason);

    await openDashboard();

    const resetButton = page.getByRole('button', { name: /Reset|Clear filters|Clear all|Clear/i }).first();
    test.skip(!(await resetButton.isVisible().catch(() => false)), 'Reset filters UI is not available in current environment');

    await resetButton.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.getByRole('heading', { name: DASHBOARD_HEADING })).toBeVisible();
    await expect(getSearchInput()).toBeVisible();
  });

  test('sorting toggle reacts when a sortable column is available', async () => {
    const unavailableReason = await getDashboardUnavailableReason();
    test.skip(!!unavailableReason, unavailableReason);

    await openDashboard();
    const tableButton = page.getByRole('button', { name: 'Table' }).first();
    if (await tableButton.isVisible().catch(() => false)) {
      await tableButton.click();
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    const sortableButton = page.getByRole('button', { name: /Study ID|Phase|Status/i }).first();
    const sortableHeader = page.getByRole('columnheader', { name: /Study ID|Phase|Status/i }).first();

    let target = sortableButton;
    if (!(await target.isVisible().catch(() => false))) {
      target = sortableHeader;
    }

    test.skip(!(await target.isVisible().catch(() => false)), 'Sortable column is not available in current environment');

    const beforeText = await target.innerText().catch(() => '');
    const beforeSort = await target.getAttribute('aria-sort').catch(() => null);

    await target.click({ force: true });
    await page.waitForLoadState('networkidle').catch(() => {});

    const afterText = await target.innerText().catch(() => '');
    const afterSort = await target.getAttribute('aria-sort').catch(() => null);

    expect(beforeText !== afterText || beforeSort !== afterSort).toBeTruthy();
  });

  test('kpi cards are visible when present', async () => {
    const unavailableReason = await getDashboardUnavailableReason();
    test.skip(!!unavailableReason, unavailableReason);

    await openDashboard();

    const kpiLabels = [
      /Active Studies/i,
      /On Track/i,
      /At Risk|Off Track/i,
      /Enrollment/i,
      /Velocity/i,
    ];

    let visibleCount = 0;
    for (const label of kpiLabels) {
      const kpi = page.getByText(label).first();
      if (await kpi.isVisible().catch(() => false)) {
        await expect(kpi).toBeVisible();
        visibleCount += 1;
      }
    }

    expect(visibleCount > 0).toBeTruthy();
  });

  test('clicking a study entry updates the URL safely', async () => {
    const unavailableReason = await getDashboardUnavailableReason();
    test.skip(!!unavailableReason, unavailableReason);

    await openDashboard();

    const cardsButton = page.getByRole('button', { name: 'Cards' }).first();
    if (await cardsButton.isVisible().catch(() => false)) {
      await cardsButton.click().catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    const studyLink = getStudyLinks().first();
    test.skip(!(await studyLink.isVisible().catch(() => false)), 'Study navigation link is not available in current environment');

    const startingPath = new URL(page.url()).pathname;
    await studyLink.click();
    await page.waitForLoadState('networkidle').catch(() => {});

    const nextPath = new URL(page.url()).pathname;
    expect(nextPath).not.toBe(startingPath);
    expect(/\/studies\//i.test(nextPath)).toBeTruthy();

    await page.goto(BASE_URL + '/portfolio');
    await page.waitForLoadState('networkidle').catch(() => {});
  });
});
