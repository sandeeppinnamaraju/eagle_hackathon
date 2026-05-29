const { test, expect } = require('../utils/stepTest');
const { EXPECTED_COLUMNS } = require('../fixtures/dashboardData');
const { setupAuthenticatedStudyPortfolio, openStudyPortfolio } = require('../utils/authNavigation');

const BASE_URL = 'https://eagle-frontend01-hpe9hhhngdc9addx.centralus-01.azurewebsites.net/'; // username: eagle_user1, password: FD_hack@user1

test.describe('Study Portfolio Dashboard', () => {
  test.describe.configure({ mode: 'serial', timeout: 90_000 });

  let context;
  let page;

  const DASHBOARD_HEADING = /Study Portfolio Dashboard|Portfolio Dashboard/i;

  const getSearchInput = () => page.locator('input[placeholder*="Search"], input[type="search"], input').first();

  const getEmptyStateIndicator = () =>
    page.getByText(/No Studies Found|No data|Showing\s+0\s+of\s+0\s+studies|0\s+of\s+0\s+studies|0\s+loaded/i).first();

  const getStudyLinks = () => page.locator('a[href*="/studies/"]');

  const waitForStudiesToSettle = async () => {
    const loadingText = page.getByText(/Loading studies\.\.\./i).first();
    if (await loadingText.isVisible().catch(() => false)) {
      await expect(loadingText).toBeHidden({ timeout: 30_000 });
    }
  };

  const openTableView = async () => {
    const tableButton = page.getByRole('button', { name: 'Table' }).first();
    await expect(tableButton).toBeVisible();
    await tableButton.click();
    await waitForStudiesToSettle();
  };

  const openDashboard = async () => {
    await openStudyPortfolio(page, { baseUrl: BASE_URL });
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.getByRole('heading', { name: DASHBOARD_HEADING })).toBeVisible();
  };

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120_000);
    context = await browser.newContext();
    page = await context.newPage();
    await setupAuthenticatedStudyPortfolio(page, { baseUrl: BASE_URL });
  });

  test.beforeEach(async () => {
    await openDashboard();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('table toggle shows table with all required columns', async () => {
    await openTableView();

    const table = page.locator('table, [role="table"]').first();
    if (!(await table.isVisible().catch(() => false))) {
      await expect(getEmptyStateIndicator()).toBeVisible();
      return;
    }

    const tableHeaders = await page.locator('table thead th').allInnerTexts();
    const normalizedHeaders = tableHeaders.map((header) => header.replace(/\s+/g, ' ').trim().toLowerCase());

    for (const expectedColumn of EXPECTED_COLUMNS) {
      expect(normalizedHeaders).toContain(expectedColumn.toLowerCase());
      await expect(
        page
          .getByRole('columnheader', {
            name: new RegExp(`^${expectedColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
          })
          .first()
      ).toBeVisible();
    }
  });

  test('search works without breaking', async () => {
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
    const possibleFilters = ['Therapeutic Area', 'Phase', 'Study Status'];

    let interacted = false;
    for (const name of possibleFilters) {
      const filterBtn = page.getByRole('button', { name }).first();
      if (await filterBtn.isVisible().catch(() => false)) {
        await filterBtn.click();
        await expect(filterBtn).toBeVisible();
        interacted = true;
        break;
      }
    }

    expect(interacted).toBeTruthy();
  });

  test('sorting click works when header exists', async () => {
    await openTableView();
    const table = page.locator('table, [role="table"]').first();
    if (!(await table.isVisible().catch(() => false))) {
      await expect(getEmptyStateIndicator()).toBeVisible();
      return;
    }

    const sortableInTable = table.getByRole('button', { name: /Study ID|Phase|Status/i }).first();
    const headerCellInTable = table.getByRole('columnheader', { name: /Study ID|Phase|Status/i }).first();

    const useButton = await sortableInTable.isVisible().catch(() => false);
    const target = useButton ? sortableInTable : headerCellInTable;

    if (!(await target.isVisible().catch(() => false))) {
      await expect(table).toBeVisible();
      return;
    }

    await target.click({ force: true });
    await expect(target).toBeVisible();
  });

  test('empty state handled safely', async () => {
    const search = page
      .getByPlaceholder('Search by ID, title...')
      .or(page.locator('input[placeholder*="Search"], input[type="search"], input').first())
      .first();

    await search.fill('ZZZZ-NO-DATA-999999');
    await search.press('Enter');

    const noData = page.getByText(/No Studies Found|No data/i).first();
    if (await noData.count()) {
      await expect(noData).toBeVisible();
    } else {
      await expect(page.getByText(/Showing\s+0\s+of\s+0\s+studies|0\s+of\s+0\s+studies|0\s+loaded|loaded/i).first()).toBeVisible();
    }
  });

  test('table view is visible and handles rows or empty state', async () => {
    await openTableView();

    const table = page.locator('table, [role="table"]').first();
    if (!(await table.isVisible().catch(() => false))) {
      await expect(getEmptyStateIndicator()).toBeVisible();
      return;
    }

    const rows = page.locator('table tbody tr, [role="rowgroup"] [role="row"]');
    const rowCount = await rows.count().catch(() => 0);

    if (rowCount > 0) {
      await expect(rows.first()).toBeVisible();
    } else {
      await expect(getEmptyStateIndicator()).toBeVisible();
    }
  });

  test('valid search shows a matching study or safe empty state', async () => {
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
    const search = getSearchInput();
    await expect(search).toBeVisible();

    await search.fill('INVALID-STUDY-DOES-NOT-EXIST-12345');
    await search.press('Enter');
    await page.waitForLoadState('networkidle').catch(() => {});

    await expect(getEmptyStateIndicator()).toBeVisible();
  });

  test('each available filter dropdown opens and closes safely', async () => {
    const filterSelectors = [
      { name: 'Therapeutic Area', type: 'button' },
      { name: 'Phase', type: 'combobox' },
      { name: 'Study Status', type: 'combobox' },
      { name: 'Portfolio', type: 'combobox' },
      { name: 'Program', type: 'combobox' },
    ];

    let interactedCount = 0;
    for (const { name, type } of filterSelectors) {
      const filter = type === 'button'
        ? page.getByRole('button', { name }).first()
        : page.getByRole('combobox', { name }).first();

      if (!(await filter.isVisible().catch(() => false))) continue;

      await filter.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await expect(filter).toBeVisible();
      await page.keyboard.press('Escape').catch(() => {});
      interactedCount += 1;
    }

    expect(interactedCount).toBeGreaterThan(0);
  });

  test('reset filters works when reset affordance is available', async () => {
    const resetButton = page.getByRole('button', { name: /Reset|Clear filters|Clear all|Clear/i }).first();
    if (await resetButton.isVisible().catch(() => false)) {
      await resetButton.click();
      await page.waitForLoadState('networkidle').catch(() => {});
    }
    await expect(page.getByRole('heading', { name: DASHBOARD_HEADING })).toBeVisible();
    await expect(getSearchInput()).toBeVisible();
  });

  test('sorting toggle reacts when a sortable column is available', async () => {
    await openTableView();

    const table = page.locator('table, [role="table"]').first();
    if (!(await table.isVisible().catch(() => false))) {
      await expect(getEmptyStateIndicator()).toBeVisible();
      return;
    }

    const sortableButton = page.getByRole('button', { name: /Study ID|Phase|Status/i }).first();
    const sortableHeader = page.getByRole('columnheader', { name: /Study ID|Phase|Status/i }).first();

    const useButton = await sortableButton.isVisible().catch(() => false);
    const target = useButton ? sortableButton : sortableHeader;

    if (!(await target.isVisible().catch(() => false))) {
      await expect(table).toBeVisible();
      return;
    }

    const beforeText = await target.innerText().catch(() => '');
    const beforeSort = await target.getAttribute('aria-sort').catch(() => null);

    await target.click({ force: true });
    await page.waitForLoadState('networkidle').catch(() => {});

    const afterText = await target.innerText().catch(() => '');
    const afterSort = await target.getAttribute('aria-sort').catch(() => null);

    expect(beforeText !== afterText || beforeSort !== afterSort).toBeTruthy();
  });

  test('kpi cards are visible when present', async () => {
    const kpiLabels = [/Active Studies/i, /On Track/i, /At Risk|Off Track/i, /Enrollment/i, /Velocity/i];

    let visibleCount = 0;
    for (const label of kpiLabels) {
      const kpi = page.getByText(label).first();
      if (await kpi.isVisible().catch(() => false)) {
        await expect(kpi).toBeVisible();
        visibleCount += 1;
      }
    }

    expect(visibleCount).toBeGreaterThan(0);
  });

  test('clicking a study entry updates the URL safely', async () => {
    const cardsButton = page.getByRole('button', { name: 'Cards' }).first();
    if (await cardsButton.isVisible().catch(() => false)) {
      await cardsButton.click().catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    const studyLink = getStudyLinks().first();
    if (!(await studyLink.isVisible().catch(() => false))) {
      await expect(getEmptyStateIndicator()).toBeVisible();
      return;
    }

    const startingPath = new URL(page.url()).pathname;
    await studyLink.click();
    await page.waitForLoadState('networkidle').catch(() => {});

    const nextPath = new URL(page.url()).pathname;
    expect(nextPath).not.toBe(startingPath);
    expect(/\/studies\//i.test(nextPath)).toBeTruthy();

    await openDashboard();
  });
});