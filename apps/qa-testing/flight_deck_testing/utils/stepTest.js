const base = require('@playwright/test');

const SCREENSHOT_ACTIONS = new Set([
  'click',
  'dblclick',
  'fill',
  'press',
  'check',
  'uncheck',
  'selectOption',
  'setInputFiles',
  'dragTo',
  'hover',
  'type',
  'goto',
]);

const PATCH_MARK = Symbol.for('flightDeck.stepEvidencePatched');

function sanitize(value) {
  return String(value || 'step')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

async function attachStepScreenshot(page, testInfo, actionName) {
  if (!page || !testInfo) return;

  if (!page.__stepEvidenceCounter) {
    page.__stepEvidenceCounter = 0;
  }

  page.__stepEvidenceCounter += 1;
  const stepNo = String(page.__stepEvidenceCounter).padStart(3, '0');
  const safeAction = sanitize(actionName || 'action');
  const fileName = `step-${stepNo}-${safeAction}.png`;
  const outputPath = testInfo.outputPath(fileName);

  try {
    await page.screenshot({ path: outputPath, fullPage: true });
    await testInfo.attach(`step-${stepNo}: ${safeAction}`, {
      path: outputPath,
      contentType: 'image/png',
    });
  } catch {
    // Ignore screenshot failures to keep tests deterministic.
  }
}

function wrapLocatorAction(proto, methodName) {
  const original = proto[methodName];
  if (typeof original !== 'function' || original[PATCH_MARK]) return;

  const wrapped = async function wrappedLocatorAction(...args) {
    const result = await original.apply(this, args);

    try {
      const page = typeof this.page === 'function' ? this.page() : null;
      const info = page ? page.__stepEvidenceTestInfo : null;
      if (SCREENSHOT_ACTIONS.has(methodName)) {
        await attachStepScreenshot(page, info, `locator-${methodName}`);
      }
    } catch {
      // Keep original action result unaffected.
    }

    return result;
  };

  wrapped[PATCH_MARK] = true;
  proto[methodName] = wrapped;
}

function patchLocatorActions(page) {
  if (!page || page.__stepEvidenceLocatorPatched) return;

  const sampleLocator = page.locator('body');
  const proto = Object.getPrototypeOf(sampleLocator);
  if (!proto) return;

  for (const methodName of SCREENSHOT_ACTIONS) {
    wrapLocatorAction(proto, methodName);
  }

  page.__stepEvidenceLocatorPatched = true;
}

function patchPageActions(page) {
  if (!page || page.__stepEvidencePagePatched) return;

  for (const methodName of SCREENSHOT_ACTIONS) {
    const original = page[methodName];
    if (typeof original !== 'function' || original[PATCH_MARK]) continue;

    const wrapped = async (...args) => {
      const result = await original.apply(page, args);
      await attachStepScreenshot(page, page.__stepEvidenceTestInfo, `page-${methodName}`);
      return result;
    };

    wrapped[PATCH_MARK] = true;
    page[methodName] = wrapped;
  }

  page.__stepEvidencePagePatched = true;
}

const test = base.test.extend({
  page: async ({ page }, use, testInfo) => {
    page.__stepEvidenceTestInfo = testInfo;
    patchPageActions(page);
    patchLocatorActions(page);

    await use(page);
  },
});

module.exports = {
  ...base,
  test,
  expect: base.expect,
};