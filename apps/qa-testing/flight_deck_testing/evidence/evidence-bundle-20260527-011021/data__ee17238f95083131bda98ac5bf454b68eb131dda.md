# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: protocal-search.spec.js >> Story 3 - Protocol Similarity Search >> search works when dropdown is not selected
- Location: tests\protocal-search.spec.js:184:5

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
  4   | const PROTOCOL_SEARCH_BASE_URL = process.env.TEST_BASE_URL || 'https://release-switching-veteran-usb.trycloudflare.com';
  5   | const PROTOCOL_SEARCH_PATH = '/protocol-search?mode=input';
  6   | 
  7   | // --- Helper functions ---
  8   | async function getSearchUnavailableReason(page) {
  9   |     const response = await page.goto(PROTOCOL_SEARCH_PATH);
  10  |     await page.waitForLoadState('networkidle').catch(() => {});
  11  | 
  12  |     const hasHeading = await page.getByText(/Protocol Similarity Search/i).first().isVisible().catch(() => false);
  13  |     if (hasHeading) {
  14  |         return null;
  15  |     }
  16  | 
  17  |     const bodyText = await page.locator('body').innerText().catch(() => '');
  18  |     if (response && response.status() >= 400) {
  19  |         return `Protocol search UI unavailable: GET /protocol-search returned ${response.status()}`;
  20  |     }
  21  | 
  22  |     if (/not found/i.test(bodyText)) {
  23  |         return 'Protocol search UI unavailable: GET /protocol-search returned Not Found';
  24  |     }
  25  | 
  26  |     return 'Protocol search UI unavailable in current environment';
  27  | }
  28  | 
  29  | async function openHome(page) {
  30  |     await page.goto(PROTOCOL_SEARCH_BASE_URL, { waitUntil: 'domcontentloaded' });
  31  | }
  32  | 
  33  | async function gotoSearch(page) {
  34  |     await openHome(page);
  35  |     const protocolSearchLink = page.getByRole('link', { name: /Protocol Search/i }).first();
> 36  |     await expect(protocolSearchLink).toBeVisible();
      |                                      ^ Error: expect(locator).toBeVisible() failed
  37  |     await protocolSearchLink.click({ force: true });
  38  |     await expect(page).toHaveURL(/\/protocol-search(\?mode=input)?$/i);
  39  |     await expect(page.getByText(/Protocol Similarity Search/i).first()).toBeVisible();
  40  | }
  41  | 
  42  | async function fillSummary(page, text) {
  43  |     const summaryInput = page.locator('textarea, input').first();
  44  |     if (await summaryInput.count()) {
  45  |         await expect(summaryInput).toBeVisible();
  46  |         await summaryInput.fill(text);
  47  |         return summaryInput;
  48  |     }
  49  |     return null;
  50  | }
  51  | 
  52  | async function clickFind(page) {
  53  |     const findButton = page.locator('button:has-text("Find"), button:has-text("Similar")').first();
  54  |     if (await findButton.count()) {
  55  |         await expect(findButton).toBeVisible();
  56  |         await findButton.scrollIntoViewIfNeeded();
  57  |         await findButton.click({ force: true }).catch(() => {});
  58  |         return true;
  59  |     }
  60  |     return false;
  61  | }
  62  | 
  63  | async function searchAndWait(page, text) {
  64  |     const summaryInput = await fillSummary(page, text);
  65  |     const clicked = await clickFind(page);
  66  |     if (!clicked && summaryInput) {
  67  |         await summaryInput.press('Enter').catch(() => {});
  68  |     }
  69  |     await page.waitForLoadState('networkidle').catch(() => {});
  70  | }
  71  | 
  72  | async function expectResultsOrEmpty(page) {
  73  |     const resultItems = page.locator('article, table tbody tr, [role="row"], [class*="card"]');
  74  |     const emptyState = page.getByText(/no results|no similar protocols|nothing found|empty|0 protocols matched/i).first();
  75  |     if ((await resultItems.count()) > 0) {
  76  |         await expect(resultItems.first()).toBeVisible();
  77  |         return 'results';
  78  |     } else if (await emptyState.count()) {
  79  |         await expect(emptyState).toBeVisible();
  80  |         return 'empty';
  81  |     } else {
  82  |         await expect(page.locator('body')).toBeVisible();
  83  |         return 'body';
  84  |     }
  85  | }
  86  | 
  87  | async function clickFirstResultOrDetails(page) {
  88  |     const detailsLink = page.locator('a:has-text("Details"), [role="link"]:has-text("Details")').first();
  89  |     const resultItems = page.locator('article, table tbody tr, [role="row"], [class*="card"]');
  90  |     if (await detailsLink.count()) {
  91  |         await detailsLink.click({ force: true }).catch(() => {});
  92  |         await page.waitForLoadState('networkidle').catch(() => {});
  93  |         return true;
  94  |     } else if ((await resultItems.count()) > 0) {
  95  |         await resultItems.first().click({ force: true }).catch(() => {});
  96  |         await page.waitForLoadState('networkidle').catch(() => {});
  97  |         return true;
  98  |     }
  99  |     return false;
  100 | }
  101 | 
  102 | async function expectDetailsHint(page) {
  103 |     const detailsHint = page.getByText(/summary|sites|enrollment|lessons learned|Back to results/i).first();
  104 |     if (await detailsHint.count()) {
  105 |         await expect(detailsHint).toBeVisible();
  106 |     } else {
  107 |         await expect(page.locator('body')).toBeVisible();
  108 |     }
  109 | }
  110 | 
  111 |  test.describe.configure({ mode: 'serial' });
  112 | test.describe('Story 3 - Protocol Similarity Search', () => {
  113 |     test('protocol search flow stays stable and handles data variations', async ({ page }) => {
  114 |         test.setTimeout(90_000);
  115 |         const unavailableReason = await getSearchUnavailableReason(page);
  116 |         test.skip(!!unavailableReason, unavailableReason);
  117 | 
  118 |         await gotoSearch(page);
  119 |         await expect(page.locator('body')).toBeVisible();
  120 |         await expect(page.getByText(/Protocol Similarity Search/i).first()).toBeVisible();
  121 | 
  122 |         // Enter summary, optionally choose therapeutic area, click search
  123 |         const summaryInput = await fillSummary(page, 'Phase 2 oncology study with adaptive design and multi-site enrollment strategy.');
  124 |         const therapeuticArea = page.locator('select, [role="combobox"]').first();
  125 |         if (await therapeuticArea.count()) {
  126 |             await expect(therapeuticArea).toBeVisible();
  127 |             await therapeuticArea.click({ force: true });
  128 |         }
  129 |         const clicked = await clickFind(page);
  130 |         if (!clicked && summaryInput) {
  131 |             await summaryInput.press('Enter').catch(() => {});
  132 |         }
  133 |         await page.waitForLoadState('networkidle').catch(() => {});
  134 | 
  135 |         // Results or empty state
  136 |         const resultsContainer = page.locator('article, table, [role="table"], [class*="card"]').first();
```