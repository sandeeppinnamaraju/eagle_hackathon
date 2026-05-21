async function clickWithFallback(page, locator, fallbackSelector) {
  try {
    await locator.click({ timeout: 5_000 });
    return;
  } catch {
    if (!fallbackSelector) throw new Error('Fallback selector is required when click fails.');
    await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Element not found: ${selector}`);
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }, fallbackSelector);
  }
}

async function waitForCountPattern(page) {
  await page.waitForFunction(() => {
    const byTestId = document.querySelector('[data-testid="studies-results-count"]');
    if (byTestId && /\d+\s+loaded\s+•\s+\d+\s+total/i.test(byTestId.textContent || '')) {
      return true;
    }
    // Fallback: scan all paragraphs for the count pattern
    const allText = Array.from(document.querySelectorAll('p, span, [role="status"]'))
      .map((el) => el.textContent || '')
      .join(' ');
    return /\d+\s+loaded\s+•\s+\d+\s+total/i.test(allText);
  }, undefined, { timeout: 30000 });
}

async function isElementPresent(page, locator) {
  try {
    return await locator.count() > 0 && await locator.isVisible();
  } catch {
    return false;
  }
}

function logSkip(message) {
  // eslint-disable-next-line no-console
  console.log(`[SKIP] ${message}`);
}

module.exports = { 
  clickWithFallback,
  waitForCountPattern,
  isElementPresent, 
  logSkip 
};
module.exports = {
  clickWithFallback,
  waitForCountPattern,
};
