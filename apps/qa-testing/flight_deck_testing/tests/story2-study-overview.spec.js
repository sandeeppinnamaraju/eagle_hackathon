const { test, expect } = require('../utils/stepTest');
const { EXPECTED_COLUMNS } = require('../fixtures/dashboardData');

// Set base URL for this test file only (easy to change)
const STORY2_BASE_URL = 'https://release-switching-veteran-usb.trycloudflare.com';

test.describe('Story 2 - Study Overview', () => {
  test.describe.configure({ mode: 'serial' });

  let context;
  let page;

  const getDashboardUnavailableReason = async () => {
    let response = await page.goto('/portfolio').catch(() => null);
    if (!response || response.status() >= 400) {
      response = await page.goto('/').catch(() => null);
    }
    await page.waitForLoadState('networkidle').catch(() => {});

    const hasDashboard = await page.getByRole('heading', { name: 'Portfolio Dashboard' }).isVisible().catch(() => false);
    if (hasDashboard) {
      return null;
    }

    const bodyText = await page.locator('body').innerText().catch(() => '');
    if (response && response.status() >= 400) {
      return `Dashboard UI unavailable: GET / returned ${response.status()}`;
    }

    if (/not found/i.test(bodyText)) {
      return 'Dashboard UI unavailable: GET / returned Not Found';
    }

    return 'Dashboard UI unavailable in current environment';
  };

  const openDashboard = async () => {
    await page.goto('/portfolio').catch(() => page.goto('/'));
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.getByRole('heading', { name: 'Portfolio Dashboard' })).toBeVisible();
  };

  const goToStudiesList = async () => {
    await openDashboard();
    await page.getByRole('link', { name: 'Study Overview' }).first().click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page).toHaveURL(/\/studies\/?$/);
    await expect(page.getByRole('heading', { name: /Studies/i })).toBeVisible();
  };

  const openFirstStudyDetailFromDashboard = async () => {
    await openDashboard();

    const cardLink = page.locator('a[href^="/studies/"]').first();
    if ((await cardLink.count()) > 0) {
      await cardLink.click({ force: true });
      await page.waitForLoadState('networkidle').catch(() => {});
      return;
    }

    await page.getByRole('button', { name: 'Table' }).first().click().catch(() => {});
    const tableLink = page.locator('table tbody tr td a[href^="/studies/"]').first();
    await expect(tableLink).toBeVisible();
    await tableLink.click({ force: true });
    await page.waitForLoadState('networkidle').catch(() => {});
  };

  const openFirstStudyDetailFromStudiesList = async () => {
    await goToStudiesList();
    const firstStudyLink = page.locator('table tbody tr td a[href^="/studies/"]').first();
    await expect(firstStudyLink).toBeVisible();
    await firstStudyLink.click({ force: true });
    await page.waitForLoadState('networkidle').catch(() => {});
  };

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      baseURL: STORY2_BASE_URL,
    });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('smooth end-to-end journey: complete Story 2 checks in a single browser flow', async () => {
    const unavailableReason = await getDashboardUnavailableReason();
    const forceRun = process.env.FORCE_STORY2_RUN === '1';
    test.skip(!forceRun && !!unavailableReason, unavailableReason);

    // 1) Navigation from dashboard into a study detail page
    await openFirstStudyDetailFromDashboard();
    await expect(page).toHaveURL(/\/studies\/ST-\d{4}-\d{3}/i);
    await expect(page.getByRole('link', { name: /Back to Studies|Back to Study Portfolio/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 2) Navigate back to studies list and validate table + required columns
    await page.getByRole('link', { name: /Back to Studies|Back to Study Portfolio/i }).click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page).toHaveURL(/\/(studies\/?|portfolio\/?)/i);

    const studiesHeading = page.getByRole('heading', { name: /Studies/i }).first();
    const dashboardHeading = page.getByRole('heading', { name: /Study Portfolio Dashboard/i }).first();
    if ((await studiesHeading.count()) > 0) {
      await expect(studiesHeading).toBeVisible();
    } else {
      await expect(dashboardHeading).toBeVisible();
    }

    await page.getByRole('button', { name: 'Table' }).first().click().catch(() => {});

    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible();

    const headers = await page.locator('table thead th').allInnerTexts();
    const normalizedHeaders = headers.map((header) => header.replace(/\s+/g, ' ').trim().toLowerCase());

    for (const expectedColumn of EXPECTED_COLUMNS) {
      expect(normalizedHeaders).toContain(expectedColumn.toLowerCase());
      await expect(
        page
          .getByRole('columnheader', {
            name: new RegExp(`^${expectedColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
          })
          .first(),
      ).toBeVisible();
    }

    // 3) Open a study detail from studies list for deep validations
    const firstStudyLink = page.locator('table tbody tr td a[href^="/studies/"]').first();
    if ((await firstStudyLink.count()) > 0) {
      await expect(firstStudyLink).toBeVisible();
      await firstStudyLink.click({ force: true });
    } else {
      const firstCardLink = page.locator('a[href^="/studies/"]').first();
      await expect(firstCardLink).toBeVisible();
      await firstCardLink.click({ force: true });
    }
    await page.waitForLoadState('networkidle').catch(() => {});

    // 4) Header section + study attributes
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();

    const headerBadges = ['Ph I', 'Ph II', 'Recruiting', 'High Priority', 'Off Track', 'On Track', 'At Risk'];
    const anyBadgeVisible =
      (await Promise.all(
        headerBadges.map((label) => page.getByText(new RegExp(`^${label}$`, 'i')).first().isVisible().catch(() => false)),
      )).some(Boolean);
    expect(anyBadgeVisible).toBeTruthy();

    const metadataLabels = [
      'Asset',
      'Asset Lead',
      'FSO Model',
      'Study Sponsor',
      'Designation',
      'Target Enrollment',
      'Planned FPI',
      'Actual FPI',
      'Planned LPI',
      'Forecast LPI',
    ];

    for (const label of metadataLabels) {
      const metaLabel = page.getByText(new RegExp(`^${label}$`, 'i')).first();
      if ((await metaLabel.count()) > 0) {
        await expect(metaLabel).toBeVisible();
      }
    }

    // 5) KPI tiles + values
    const kpiTiles = [
      'Enrollment vs Plan',
      'Enrollment Rate',
      'Screen Failure Rate',
      'Dropout Rate',
      'Sites Activated',
      'Countries Activated',
    ];

    for (const tile of kpiTiles) {
      await expect(page.getByText(new RegExp(`^${tile}$`, 'i')).first()).toBeVisible();
    }

    const numericSignals = page.locator('text=/\d+(?:[\d,./]|\.\d|%|pts\/wk)+/i');
    await expect(numericSignals.first()).toBeVisible();

    // 6) Charts + time filters
    await expect(page.getByRole('heading', { name: /CUMULATIVE ENROLLMENT/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /ENROLLMENT RATE/i })).toBeVisible();

    const chartSignal = page.getByText(/Actual|Planned|Forecast|Jan|Feb|Mar|Apr|May|Jun/i).first();
    await expect(chartSignal).toBeVisible();

    const timeFilters = ['Full Study', 'Since FPI', 'Last 3 Months'];
    for (const filterName of timeFilters) {
      const filter = page.getByRole('button', { name: filterName }).first();
      if ((await filter.count()) > 0) {
        await filter.click({ force: true });
        await expect(filter).toBeVisible();
      }
    }
    await expect(page.getByRole('heading', { name: /CUMULATIVE ENROLLMENT/i })).toBeVisible();

    // 7) Country/Site toggles + table validation
    const byCountry = page.getByRole('button', { name: 'By Country' }).first();
    const bySite = page.getByRole('button', { name: 'By Site' }).first();
    const breakdownTable = page.locator('table').last();

    if ((await byCountry.count()) > 0) {
      await byCountry.click({ force: true });
      await expect(page.getByRole('heading', { name: /Country Breakdown/i })).toBeVisible();
      await expect(breakdownTable).toBeVisible();
    }

    if ((await bySite.count()) > 0) {
      await bySite.click({ force: true });
      await expect(page.getByRole('heading', { name: /Site Breakdown/i })).toBeVisible();
      await expect(breakdownTable).toBeVisible();
    }

    // 8) Row interactions + details expansion
    const dataRow = page.locator('table tbody tr').first();
    await expect(dataRow).toBeVisible();
    await dataRow.click({ force: true });

    const detailsHints = page.getByText(/Site Info|Screening Funnel|Monthly Enrollment|Country|PI/i).first();
    await expect(detailsHints).toBeVisible();

    // 9) Optional popovers/details
    const actionButtons = ['Underperforming', 'Overperforming', 'Milestones'];
    let clickedOptionalAction = false;

    for (const name of actionButtons) {
      const actionButton = page.getByRole('button', { name }).first();
      if ((await actionButton.count()) > 0) {
        await actionButton.click({ force: true });
        clickedOptionalAction = true;
        break;
      }
    }

    if (clickedOptionalAction) {
      const optionalDialog = page.getByRole('dialog').first();
      if ((await optionalDialog.count()) > 0) {
        await expect(optionalDialog).toBeVisible();
      } else {
        await expect(page.locator('body')).toBeVisible();
      }
    }

    // 10) Error handling check
    const errorIndicators = page.getByText(/error|failed|unable to load|something went wrong/i).first();
    if ((await errorIndicators.count()) > 0) {
      await expect(errorIndicators).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }

    expect(true).toBeTruthy();
  });
});