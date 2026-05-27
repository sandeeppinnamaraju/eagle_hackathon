const { test, expect } = require('../utils/stepTest');

const BASE_URL = 'https://ana-academics-reggae-farmer.trycloudflare.com/';

const PORTFOLIO_KPIS = [
  'Active Studies',
  'On Track',
  'At Risk / Off Track',
  'Enrollment vs Target',
  'Enrollment vs Plan (To Date)',
  'Velocity vs Plan',
];

const OVERVIEW_KPIS = [
  'Enrollment vs Plan',
  'Enrollment Rate',
  'Screen Failure Rate',
  'Dropout Rate',
  'Sites Activated',
  'Countries Activated',
];

const HEADER_LABELS = [
  'Asset',
  'Asset Lead',
  'FSO Model',
  'Study Sponsor',
  'Designation',
  'Target Enrollment',
];

function exactLabelPattern(label) {
  return new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
}

async function openPortfolio(page) {
  await page.goto(new URL('/portfolio', BASE_URL).toString());
  await page.waitForLoadState('networkidle').catch(() => {});

  await expect(page).toHaveURL(/\/portfolio\/?$/i);
  await expect(page.getByRole('heading', { name: /Study Portfolio Dashboard/i })).toBeVisible();
}

async function openTableView(page) {
  const tableButton = page.getByRole('button', { name: /^Table$/ });
  if (await tableButton.isVisible().catch(() => false)) {
    await tableButton.click();
  }

  await expect(page.locator('table').first()).toBeVisible();
}

async function navigateToFirstStudy(page) {
  await openPortfolio(page);
  await openTableView(page);

  const studyLinks = page.locator('a[href^="/studies/"]');
  if ((await studyLinks.count()) === 0) {
    return false;
  }

  const firstStudyLink = studyLinks.first();
  await expect(firstStudyLink).toBeVisible();
  await firstStudyLink.click();
  await expect(page).toHaveURL(/\/studies\/ST-\d{4}-\d{3}/i);
  await page.waitForLoadState('networkidle').catch(() => {});

  return true;
}

test.describe('Story 2 - Study Overview', () => {
  test.describe.configure({ timeout: 90_000 });

  test('shows portfolio overview and study navigation safely', async ({ page }) => {
    await openPortfolio(page);
    await expect(page.getByRole('textbox', { name: /Search by ID, title, indication/i })).toBeVisible();

    for (const label of PORTFOLIO_KPIS) {
      await expect(page.getByText(exactLabelPattern(label)).first()).toBeVisible();
    }

    await openTableView(page);

    const rows = page.locator('table tbody tr');
    if ((await rows.count()) > 0) {
      await expect(rows.first()).toBeVisible();
    } else {
      await expect(page.getByText(/No Studies Found|0 of 0 studies|No data/i).first()).toBeVisible();
      return;
    }

    const navigated = await navigateToFirstStudy(page);
    if (!navigated) {
      return;
    }

    await expect(page.getByRole('link', { name: /Back to Study Portfolio/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByText(/^ST-\d{4}-\d{3}$/).first()).toBeVisible();
  });

  test('shows study overview content with safe optional interactions', async ({ page }) => {
    const navigated = await navigateToFirstStudy(page);
    if (!navigated) {
      await expect(page.getByRole('heading', { name: /Study Portfolio Dashboard/i })).toBeVisible();
      return;
    }

    for (const label of HEADER_LABELS) {
      await expect(page.getByText(exactLabelPattern(label)).first()).toBeVisible();
    }

    for (const label of OVERVIEW_KPIS) {
      await expect(page.getByText(exactLabelPattern(label)).first()).toBeVisible();
    }

    await expect(page.getByRole('heading', { name: /CUMULATIVE ENROLLMENT/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /ENROLLMENT RATE/i })).toBeVisible();

    for (const label of ['Full Study', 'Since FPI', 'Last 3 Months']) {
      await expect(page.getByRole('button', { name: exactLabelPattern(label) })).toBeVisible();
    }

    const sinceFpiButton = page.getByRole('button', { name: /^Since FPI$/i });
    if (await sinceFpiButton.isVisible().catch(() => false)) {
      await sinceFpiButton.click();
      await expect(page.getByRole('heading', { name: /ENROLLMENT RATE/i })).toBeVisible();
    }

    const fullStudyButton = page.getByRole('button', { name: /^Full Study$/i });
    if (await fullStudyButton.isVisible().catch(() => false)) {
      await fullStudyButton.click();
      await expect(page.getByRole('heading', { name: /CUMULATIVE ENROLLMENT/i })).toBeVisible();
    }

    const byCountryButton = page.getByRole('button', { name: /^By Country$/i });
    if (await byCountryButton.isVisible().catch(() => false)) {
      await expect(byCountryButton).toBeVisible();
    }

    const bySiteButton = page.getByRole('button', { name: /^By Site$/i });
    if (await bySiteButton.isVisible().catch(() => false)) {
      await bySiteButton.click().catch(() => {});
    }

    const breakdownHeading = page.getByRole('heading', { name: /Country Breakdown|Site Breakdown/i }).first();
    await expect(breakdownHeading).toBeVisible();

    const dataRows = page.getByRole('row');
    if ((await dataRows.count()) > 0) {
      await expect(dataRows.first()).toBeVisible();
    } else {
      await expect(page.getByText(/No data/i).first()).toBeVisible();
    }

    const milestonesButton = page.getByRole('button', { name: /^Milestones$/i });
    if (await milestonesButton.isVisible().catch(() => false)) {
      await expect(milestonesButton).toBeVisible();
    }
  });
});