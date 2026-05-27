# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: protocal-search.spec.js >> Story 3 - Protocol Similarity Search >> search works when dropdown is not selected
- Location: tests\protocal-search.spec.js:186:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('link', { name: /Protocol Search/i }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('link', { name: /Protocol Search/i }).first()

```

```yaml
- text: "{\"detail\":\"Not Found\"}"
```

# Test source

```ts
  1   | 
  2   | const { test, expect } = require('../utils/stepTest');
  3   | 
  4   | // Set base URL for this test file only (easy to change)
  5   | const BASE_URL = 'https://release-switching-veteran-usb.trycloudflare.com/';
  6   | const PROTOCOL_SEARCH_BASE_URL = process.env.TEST_BASE_URL || 'https://release-switching-veteran-usb.trycloudflare.com';
  7   | const PROTOCOL_SEARCH_PATH = '/protocol-search?mode=input';
  8   | 
  9   | // --- Helper functions ---
  10  | async function getSearchUnavailableReason(page) {
  11  |     const response = await page.goto(PROTOCOL_SEARCH_PATH);
  12  |     await page.waitForLoadState('networkidle').catch(() => {});
  13  | 
  14  |     const hasHeading = await page.getByText(/Protocol Similarity Search/i).first().isVisible().catch(() => false);
  15  |     if (hasHeading) {
  16  |         return null;
  17  |     }
  18  | 
  19  |     const bodyText = await page.locator('body').innerText().catch(() => '');
  20  |     if (response && response.status() >= 400) {
  21  |         return `Protocol search UI unavailable: GET /protocol-search returned ${response.status()}`;
  22  |     }
  23  | 
  24  |     if (/not found/i.test(bodyText)) {
  25  |         return 'Protocol search UI unavailable: GET /protocol-search returned Not Found';
  26  |     }
  27  | 
  28  |     return 'Protocol search UI unavailable in current environment';
  29  | }
  30  | 
  31  | async function openHome(page) {
  32  |     await page.goto(PROTOCOL_SEARCH_BASE_URL, { waitUntil: 'domcontentloaded' });
  33  | }
  34  | 
  35  | async function gotoSearch(page) {
  36  |     await openHome(page);
  37  |     const protocolSearchLink = page.getByRole('link', { name: /Protocol Search/i }).first();
> 38  |     await expect(protocolSearchLink).toBeVisible();
      |                                      ^ Error: expect(locator).toBeVisible() failed
  39  |     await protocolSearchLink.click({ force: true });
  40  |     await expect(page).toHaveURL(/\/protocol-search(\?mode=input)?$/i);
  41  |     await expect(page.getByText(/Protocol Similarity Search/i).first()).toBeVisible();
  42  | }
  43  | 
  44  | async function fillSummary(page, text) {
  45  |     const summaryInput = page.locator('textarea, input').first();
  46  |     if (await summaryInput.count()) {
  47  |         await expect(summaryInput).toBeVisible();
  48  |         await summaryInput.fill(text);
  49  |         return summaryInput;
  50  |     }
  51  |     return null;
  52  | }
  53  | 
  54  | async function clickFind(page) {
  55  |     const findButton = page.locator('button:has-text("Find"), button:has-text("Similar")').first();
  56  |     if (await findButton.count()) {
  57  |         await expect(findButton).toBeVisible();
  58  |         await findButton.scrollIntoViewIfNeeded();
  59  |         await findButton.click({ force: true }).catch(() => {});
  60  |         return true;
  61  |     }
  62  |     return false;
  63  | }
  64  | 
  65  | async function searchAndWait(page, text) {
  66  |     const summaryInput = await fillSummary(page, text);
  67  |     const clicked = await clickFind(page);
  68  |     if (!clicked && summaryInput) {
  69  |         await summaryInput.press('Enter').catch(() => {});
  70  |     }
  71  |     await page.waitForLoadState('networkidle').catch(() => {});
  72  | }
  73  | 
  74  | async function expectResultsOrEmpty(page) {
  75  |     const resultItems = page.locator('article, table tbody tr, [role="row"], [class*="card"]');
  76  |     const emptyState = page.getByText(/no results|no similar protocols|nothing found|empty|0 protocols matched/i).first();
  77  |     if ((await resultItems.count()) > 0) {
  78  |         await expect(resultItems.first()).toBeVisible();
  79  |         return 'results';
  80  |     } else if (await emptyState.count()) {
  81  |         await expect(emptyState).toBeVisible();
  82  |         return 'empty';
  83  |     } else {
  84  |         await expect(page.locator('body')).toBeVisible();
  85  |         return 'body';
  86  |     }
  87  | }
  88  | 
  89  | async function clickFirstResultOrDetails(page) {
  90  |     const detailsLink = page.locator('a:has-text("Details"), [role="link"]:has-text("Details")').first();
  91  |     const resultItems = page.locator('article, table tbody tr, [role="row"], [class*="card"]');
  92  |     if (await detailsLink.count()) {
  93  |         await detailsLink.click({ force: true }).catch(() => {});
  94  |         await page.waitForLoadState('networkidle').catch(() => {});
  95  |         return true;
  96  |     } else if ((await resultItems.count()) > 0) {
  97  |         await resultItems.first().click({ force: true }).catch(() => {});
  98  |         await page.waitForLoadState('networkidle').catch(() => {});
  99  |         return true;
  100 |     }
  101 |     return false;
  102 | }
  103 | 
  104 | async function expectDetailsHint(page) {
  105 |     const detailsHint = page.getByText(/summary|sites|enrollment|lessons learned|Back to results/i).first();
  106 |     if (await detailsHint.count()) {
  107 |         await expect(detailsHint).toBeVisible();
  108 |     } else {
  109 |         await expect(page.locator('body')).toBeVisible();
  110 |     }
  111 | }
  112 | 
  113 |  test.describe.configure({ mode: 'serial' });
  114 | test.describe('Story 3 - Protocol Similarity Search', () => {
  115 |     test('protocol search flow stays stable and handles data variations', async ({ page }) => {
  116 |         test.setTimeout(90_000);
  117 |         const unavailableReason = await getSearchUnavailableReason(page);
  118 |         test.skip(!!unavailableReason, unavailableReason);
  119 | 
  120 |         await gotoSearch(page);
  121 |         await expect(page.locator('body')).toBeVisible();
  122 |         await expect(page.getByText(/Protocol Similarity Search/i).first()).toBeVisible();
  123 | 
  124 |         // Enter summary, optionally choose therapeutic area, click search
  125 |         const summaryInput = await fillSummary(page, 'Phase 2 oncology study with adaptive design and multi-site enrollment strategy.');
  126 |         const therapeuticArea = page.locator('select, [role="combobox"]').first();
  127 |         if (await therapeuticArea.count()) {
  128 |             await expect(therapeuticArea).toBeVisible();
  129 |             await therapeuticArea.click({ force: true });
  130 |         }
  131 |         const clicked = await clickFind(page);
  132 |         if (!clicked && summaryInput) {
  133 |             await summaryInput.press('Enter').catch(() => {});
  134 |         }
  135 |         await page.waitForLoadState('networkidle').catch(() => {});
  136 | 
  137 |         // Results or empty state
  138 |         const resultsContainer = page.locator('article, table, [role="table"], [class*="card"]').first();
```