const { expect } = require('@playwright/test');
const { clickWithFallback, waitForCountPattern } = require('../utils/uiHelpers');

class DashboardPage {
  constructor(page) {
    this.page = page;
    this.searchInput = page
      .getByRole('textbox', { name: /search by id, title/i })
      .or(page.getByPlaceholder(/search by id, title/i))
      .or(page.getByTestId('studies-search-input'));
    this.resultsCount = page.getByTestId('studies-results-count').or(page.getByText(/\d+\s+loaded\s+•\s+\d+\s+total/i));
  }

  async isTunnelErrorPage() {
    const tunnelHeading = this.page.getByRole('heading', { name: /cloudflare tunnel error/i });
    const errorCode = this.page.getByRole('heading', { name: /error\s*1033/i });
    return (await tunnelHeading.isVisible().catch(() => false)) || (await errorCode.isVisible().catch(() => false));
  }

  async waitForDashboardShell() {
    const shellAnchor = this.page
      .locator('table')
      .or(this.page.getByRole('grid'))
      .or(this.searchInput.first())
      .or(this.resultsCount)
      .or(this.page.getByText(/study id|studies/i).first());
    await expect(shellAnchor.first()).toBeVisible();
  }

  async goto() {
    await this.page.goto('/');

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const tunnelError = await this.isTunnelErrorPage();
      if (tunnelError) {
        return;
        this.navStudyPortfolio = page.getByRole('link', { name: 'Study Portfolio' });
        this.navStudyOverview = page.getByRole('link', { name: 'Study Overview' });
        this.navProtocolSearch = page.getByRole('link', { name: 'Protocol Search' });
        this.searchBox = page.getByPlaceholder('Search by ID, title...');
        this.filters = [
          { name: 'Therapeutic Area', locator: page.getByRole('button', { name: 'Therapeutic Area' }) },
          { name: 'Phase', locator: page.getByRole('button', { name: 'Phase' }) },
          { name: 'Study Status', locator: page.getByRole('button', { name: 'Study Status' }) },
          { name: 'Portfolio', locator: page.getByRole('button', { name: 'Portfolio' }) },
          { name: 'Program', locator: page.getByRole('button', { name: 'Program' }) },
          { name: 'Region', locator: page.getByRole('button', { name: 'Region' }) },
          { name: 'FPI / LPO', locator: page.getByRole('button', { name: 'FPI / LPO' }) },
        ];
        this.kpiCards = [
          { name: 'Active Studies', locator: page.getByText('Active Studies') },
          { name: 'On Track', locator: page.getByText('On Track') },
          { name: 'At Risk / Off Track', locator: page.getByText('At Risk / Off Track') },
          { name: 'Enrollment vs Target', locator: page.getByText('Enrollment vs Target') },
          { name: 'Schedule Adherence', locator: page.getByText('Schedule Adherence') },
          { name: 'Velocity vs Plan', locator: page.getByText('Velocity vs Plan') },
        ];
        this.tableLoadedCount = page.getByText(/loaded •/);
        this.studyCards = page.locator('a[href^="/studies/"]');
        this.noResults = page.getByText('No Studies Found', { exact: false });
        this.tableButton = page.getByRole('button', { name: 'Table' });
        const retryButton = this.page.getByRole('button', { name: 'Try again' });
        if (await retryButton.isVisible().catch(() => false)) {
          await retryButton.click();
        } else {
        // Switch to Table view if not already
        if (await isElementPresent(this.page, this.tableButton)) {
          await this.tableButton.click();
        }
        .locator('table')
        .or(this.page.getByRole('grid'))
        .or(this.searchInput.first())
        await this.searchBox.fill(term);
        .first()
        .isVisible()
        .catch(() => false);

        await this.searchBox.fill('');
        .getByRole('heading', { name: /portfolio dashboard|study portfolio|studies/i })
        .isVisible()
        .catch(() => false);
      if (isDashboardVisible || hasDashboardShell) {
        const text = await this.tableLoadedCount.textContent();
        await this.waitForDashboardShell();
        return;
      }

      await this.page.waitForLoadState('domcontentloaded');
    }

    await this.waitForDashboardShell();
    await waitForCountPattern(this.page);
  }

  async goToStudiesNav() {
    await this.page.getByRole('link', { name: 'Study Overview' }).click();
  }

  async switchToTableView() {
    if (await this.page.locator('table').isVisible().catch(() => false)) {
      return;
    }

    const tableButton = this.page.getByRole('button', { name: /^Table$/ });
    await clickWithFallback(this.page, tableButton, 'button:has-text("Table")');

    const hasTable = await this.page.locator('table').isVisible().catch(() => false);
    if (!hasTable) {
      await this.page.evaluate(() => {
        const tableButtonNode = Array.from(document.querySelectorAll('button')).find(
          (btn) => btn.textContent && btn.textContent.trim() === 'Table',
        );
        if (tableButtonNode) {
          tableButtonNode.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      });
    }

    await expect(this.page.locator('table')).toBeVisible();
    await this.page.waitForLoadState('networkidle');
  }

  async switchToCardsView() {
    const cardsButton = this.page.getByRole('button', { name: /^Cards$/ });
    await clickWithFallback(this.page, cardsButton, 'button:has-text("Cards")');
  }

  async getColumnHeaders() {
    const headers = await this.page.locator('table thead th').allInnerTexts();
    return headers.map((value) => value.trim());
  }

  async getResultsCountText() {
    return (await this.resultsCount.innerText()).trim();
  }

  async getRowsPerPageText() {
    return this.page.locator('text=Rows per page:').innerText();
  }

  async openFilterByTestId(testId) {
    const selector = `[data-testid="${testId}"]`;
    const labelByTestId = {
      'studies-filter-therapeutic-area-trigger': 'Therapeutic Area',
      'studies-filter-phase-trigger': 'Phase',
      'studies-filter-study-status-trigger': 'Study Status',
      'studies-filter-portfolio-trigger': 'Portfolio',
      'studies-filter-program-trigger': 'Program',
      'studies-filter-region-trigger': 'Region',
      'studies-filter-fpi-lpo-trigger': 'FPI / LPO',
    };
    const fallbackLabel = labelByTestId[testId] || /therapeutic area|phase|study status|portfolio|program|region|fpi\s*\/\s*lpo/i;
    const trigger = this.page.locator(selector).or(this.page.getByRole('button', { name: fallbackLabel }));
    await expect(trigger.first()).toBeVisible();
    await clickWithFallback(this.page, trigger.first(), selector);
    await expect(this.page.getByRole('dialog')).toBeVisible();
  }

  async selectFirstDialogOption() {
    const dialog = this.page.getByRole('dialog');
    const option = dialog.getByRole('button').first();
    await expect(option).toBeVisible();
    const optionText = (await option.innerText()).trim();
    await option.click({ force: true });
    await this.page.keyboard.press('Escape');
    await waitForCountPattern(this.page);
    return optionText;
  }

  async sortByHeader(headerName) {
    const headerButton = this.page.locator('table thead').getByRole('button', { name: new RegExp(`^${headerName}$`, 'i') });
    await expect(headerButton).toBeVisible();
    await headerButton.click({ force: true });
    await this.page.waitForLoadState('networkidle');
  }

  async getColumnIndex(headerName) {
    const headers = await this.getColumnHeaders();
    return headers.findIndex((header) => header.toLowerCase() === headerName.toLowerCase());
  }

  async getColumnValues(headerName, maxRows = 10) {
    const index = await this.getColumnIndex(headerName);
    if (index < 0) throw new Error(`Column not found: ${headerName}`);

    const rowCount = await this.page.locator('table tbody tr').count();
    const values = [];
    for (let i = 0; i < Math.min(rowCount, maxRows); i += 1) {
      const cell = this.page.locator('table tbody tr').nth(i).locator('td').nth(index);
      values.push((await cell.innerText()).trim());
    }
    return values;
  }

  async searchFor(value, submitWithEnter = true) {
    await expect(this.searchInput.first()).toBeVisible();
    await this.searchInput.first().fill(value);
    if (submitWithEnter) {
      await this.searchInput.first().press('Enter');
    }
    await this.page.waitForLoadState('networkidle');
  }

  async clearSearch() {
    await this.searchInput.first().fill('');
    await this.searchInput.first().press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async getFirstStudyId() {
    return (await this.page.locator('table tbody tr').first().locator('td').first().innerText()).trim();
  }

  async getFirstIndication() {
    return (await this.page.locator('table tbody tr').first().locator('td').nth(3).innerText()).trim();
  }

  async getFirstCardTitle() {
    return (await this.page.getByRole('heading', { level: 3 }).first().innerText()).trim();
  }

  async getPerformancePairs(maxRows = 25) {
    const rows = this.page.locator('table tbody tr');
    const rowCount = await rows.count();
    const pairs = [];

    for (let i = 0; i < Math.min(rowCount, maxRows); i += 1) {
      const row = rows.nth(i);
      const percentText = (await row.locator('td').nth(9).innerText()).trim();
      const statusText = (await row.locator('td').nth(12).innerText()).trim();
      pairs.push({ percentText, statusText });
    }

    return pairs;
  }

  async assertKpiCardsVisible() {
    await expect(this.page.getByText('Active Studies')).toBeVisible();
    await expect(this.page.getByText('On Track')).toBeVisible();
    await expect(this.page.getByText('At Risk / Off Track')).toBeVisible();
    await expect(this.page.getByText('Enrollment vs Target')).toBeVisible();
    await expect(this.page.getByText('Velocity vs Plan')).toBeVisible();
  }

  async clickFirstStudyRow() {
    const urlBefore = this.page.url();
    const row = this.page.locator('table tbody tr').first();
    await expect(row).toBeVisible();
    await row.click({ force: true });
    await this.page.waitForLoadState('networkidle');

    const urlChanged = this.page.url() !== urlBefore;
    if (!urlChanged) {
      const firstStudyCell = row.locator('td').first();
      if (await firstStudyCell.isVisible().catch(() => false)) {
        await firstStudyCell.click({ force: true });
        await this.page.waitForLoadState('networkidle');
      }
    }
  }

  async isNoStudiesFoundVisible() {
    return this.page.getByText('No Studies Found').isVisible();
  }
}

module.exports = { DashboardPage };
