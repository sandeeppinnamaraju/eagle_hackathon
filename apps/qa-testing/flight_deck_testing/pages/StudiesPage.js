const { expect } = require('@playwright/test');

class StudiesPage {
  constructor(page) {
    this.page = page;
  }

  async expectLoaded() {
    await expect(this.page.getByRole('heading', { name: 'Studies' })).toBeVisible();
  }

  async expectUrlContainsStudies() {
    await expect(this.page).toHaveURL(/\/studies/i);
  }

  async getNoResultsState() {
    return this.page.getByText('No Studies Found').isVisible();
  }
}

module.exports = { StudiesPage };
