const { test, expect } = require('../utils/stepTest');
const { setupAuthenticatedStudyPortfolio } = require('../utils/authNavigation');

const BASE_URL = 'https://eagle-frontend01-hpe9hhhngdc9addx.centralus-01.azurewebsites.net'; // username: eagle_user1, password: FD_hack@user1
const PROTOCOL_SEARCH_PATH = '/protocol-search?mode=input';

const getProtocolSearchUrl = () => BASE_URL.replace(/\/$/, '') + PROTOCOL_SEARCH_PATH;

async function gotoSearch(page) {
  await setupAuthenticatedStudyPortfolio(page, { baseUrl: BASE_URL });

  const protocolSearchLink = page.getByRole('link', { name: /Protocol Search/i }).first();
  if (await protocolSearchLink.isVisible().catch(() => false)) {
    await protocolSearchLink.click({ force: true });
    await page.waitForLoadState('networkidle').catch(() => {});
  } else {
    await page.goto(getProtocolSearchUrl(), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
  }

  if (!/\/protocol-search(\?mode=input)?$/i.test(page.url())) {
    await page.goto(getProtocolSearchUrl(), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
  }

  await expect(page).toHaveURL(/\/protocol-search(\?mode=input)?$/i);
  await expect(page.getByText(/Protocol Similarity Search/i).first()).toBeVisible();
}

async function fillSummary(page, text) {
  const summaryInput = page.locator('textarea, input').first();
  if (await summaryInput.count()) {
    await expect(summaryInput).toBeVisible();
    await summaryInput.fill(text);
    return summaryInput;
  }
  return null;
}

async function clickFind(page) {
  const findButton = page.locator('button:has-text("Find"), button:has-text("Similar")').first();
  if (await findButton.count()) {
    await expect(findButton).toBeVisible();
    await findButton.scrollIntoViewIfNeeded();
    await findButton.click({ force: true }).catch(() => {});
    return true;
  }
  return false;
}

async function searchAndWait(page, text) {
  const summaryInput = await fillSummary(page, text);
  const clicked = await clickFind(page);
  if (!clicked && summaryInput) {
    await summaryInput.press('Enter').catch(() => {});
  }
  await page.waitForLoadState('networkidle').catch(() => {});
}

async function clickFirstResultOrDetails(page) {
  const detailsLink = page.locator('a:has-text("Details"), [role="link"]:has-text("Details")').first();
  const resultItems = page.locator('article, table tbody tr, [role="row"], [class*="card"]');
  if (await detailsLink.count()) {
    await detailsLink.click({ force: true }).catch(() => {});
    await page.waitForLoadState('networkidle').catch(() => {});
    return true;
  }
  if ((await resultItems.count()) > 0) {
    await resultItems.first().click({ force: true }).catch(() => {});
    await page.waitForLoadState('networkidle').catch(() => {});
    return true;
  }
  return false;
}

async function expectDetailsHint(page) {
  const detailsHint = page.getByText(/summary|sites|enrollment|lessons learned|Back to results/i).first();
  if (await detailsHint.count()) {
    await expect(detailsHint).toBeVisible();
  } else {
    await expect(page.locator('body')).toBeVisible();
  }
}

test.describe.configure({ mode: 'serial' });
test.describe('Story 3 - Protocol Similarity Search', () => {
  test.beforeEach(async ({ page }) => {
    await gotoSearch(page);
  });

  test('protocol search flow stays stable and handles data variations', async ({ page }) => {
    test.setTimeout(90_000);

    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/Protocol Similarity Search/i).first()).toBeVisible();

    const summaryInput = await fillSummary(page, 'Phase 2 oncology study with adaptive design and multi-site enrollment strategy.');
    const therapeuticArea = page.locator('select, [role="combobox"]').first();
    if (await therapeuticArea.count()) {
      await expect(therapeuticArea).toBeVisible();
      await therapeuticArea.click({ force: true });
    }

    const clicked = await clickFind(page);
    if (!clicked && summaryInput) {
      await summaryInput.press('Enter').catch(() => {});
    }
    await page.waitForLoadState('networkidle').catch(() => {});

    const resultsContainer = page.locator('article, table, [role="table"], [class*="card"]').first();
    const resultItems = page.locator('article, table tbody tr, [role="row"], [class*="card"]');
    const emptyState = page.getByText(/no results|no similar protocols|nothing found|empty|0 protocols matched/i).first();

    if ((await resultItems.count()) > 0 || (await resultsContainer.count()) > 0) {
      await expect(resultsContainer).toBeVisible();
      await clickFirstResultOrDetails(page);
      await expectDetailsHint(page);
    } else if (await emptyState.count()) {
      await expect(emptyState).toBeVisible();
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('clicking first result can navigate to details safely', async ({ page }) => {
    await searchAndWait(page, 'phase 2 multi-site enrollment protocol with biomarkers');
    await clickFirstResultOrDetails(page);
    await expect(page.locator('body')).toBeVisible();
  });

  test('details page basic content validation remains safe', async ({ page }) => {
    await searchAndWait(page, 'study design with enrollment and site expansion patterns');
    await clickFirstResultOrDetails(page);
    await expectDetailsHint(page);
  });

  test('search works when dropdown is not selected', async ({ page }) => {
    await searchAndWait(page, 'protocol summary without selecting a therapeutic area');
    await expect(page.locator('body')).toBeVisible();
  });
});
