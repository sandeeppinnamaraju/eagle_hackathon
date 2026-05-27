# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: protocal-search.spec.js >> Story 3 - Protocol Similarity Search >> search works when dropdown is not selected
- Location: tests\protocal-search.spec.js:188:5

# Error details

```
ReferenceError: PROTOCOL_SEARCH_BASE_URL is not defined
```

# Test source

```ts
  1   | 
  2   | const { test, expect } = require('../utils/stepTest');
  3   | 
  4   | // Set base URL for this test file only (easy to change)
  5   | const BASE_URL = 'https://release-switching-veteran-usb.trycloudflare.com/';
  6   | const PROTOCOL_SEARCH_PATH = '/protocol-search?mode=input';
  7   | 
  8   | // Helper to get full URL
  9   | const getProtocolSearchUrl = () => BASE_URL.replace(/\/$/, '') + PROTOCOL_SEARCH_PATH;
  10  | 
  11  | // --- Helper functions ---
  12  | async function getSearchUnavailableReason(page) {
  13  |     const response = await page.goto(PROTOCOL_SEARCH_PATH);
  14  |     await page.waitForLoadState('networkidle').catch(() => {});
  15  | 
  16  |     const hasHeading = await page.getByText(/Protocol Similarity Search/i).first().isVisible().catch(() => false);
  17  |     if (hasHeading) {
  18  |         return null;
  19  |     }
  20  | 
  21  |     const bodyText = await page.locator('body').innerText().catch(() => '');
  22  |     if (response && response.status() >= 400) {
  23  |         return `Protocol search UI unavailable: GET /protocol-search returned ${response.status()}`;
  24  |     }
  25  | 
  26  |     if (/not found/i.test(bodyText)) {
  27  |         return 'Protocol search UI unavailable: GET /protocol-search returned Not Found';
  28  |     }
  29  | 
  30  |     return 'Protocol search UI unavailable in current environment';
  31  | }
  32  | 
  33  | async function openHome(page) {
> 34  |     await page.goto(PROTOCOL_SEARCH_BASE_URL, { waitUntil: 'domcontentloaded' });
      |                     ^ ReferenceError: PROTOCOL_SEARCH_BASE_URL is not defined
  35  | }
  36  | 
  37  | async function gotoSearch(page) {
  38  |     await openHome(page);
  39  |     const protocolSearchLink = page.getByRole('link', { name: /Protocol Search/i }).first();
  40  |     await expect(protocolSearchLink).toBeVisible();
  41  |     await protocolSearchLink.click({ force: true });
  42  |     await expect(page).toHaveURL(/\/protocol-search(\?mode=input)?$/i);
  43  |     await expect(page.getByText(/Protocol Similarity Search/i).first()).toBeVisible();
  44  | }
  45  | 
  46  | async function fillSummary(page, text) {
  47  |     const summaryInput = page.locator('textarea, input').first();
  48  |     if (await summaryInput.count()) {
  49  |         await expect(summaryInput).toBeVisible();
  50  |         await summaryInput.fill(text);
  51  |         return summaryInput;
  52  |     }
  53  |     return null;
  54  | }
  55  | 
  56  | async function clickFind(page) {
  57  |     const findButton = page.locator('button:has-text("Find"), button:has-text("Similar")').first();
  58  |     if (await findButton.count()) {
  59  |         await expect(findButton).toBeVisible();
  60  |         await findButton.scrollIntoViewIfNeeded();
  61  |         await findButton.click({ force: true }).catch(() => {});
  62  |         return true;
  63  |     }
  64  |     return false;
  65  | }
  66  | 
  67  | async function searchAndWait(page, text) {
  68  |     const summaryInput = await fillSummary(page, text);
  69  |     const clicked = await clickFind(page);
  70  |     if (!clicked && summaryInput) {
  71  |         await summaryInput.press('Enter').catch(() => {});
  72  |     }
  73  |     await page.waitForLoadState('networkidle').catch(() => {});
  74  | }
  75  | 
  76  | async function expectResultsOrEmpty(page) {
  77  |     const resultItems = page.locator('article, table tbody tr, [role="row"], [class*="card"]');
  78  |     const emptyState = page.getByText(/no results|no similar protocols|nothing found|empty|0 protocols matched/i).first();
  79  |     if ((await resultItems.count()) > 0) {
  80  |         await expect(resultItems.first()).toBeVisible();
  81  |         return 'results';
  82  |     } else if (await emptyState.count()) {
  83  |         await expect(emptyState).toBeVisible();
  84  |         return 'empty';
  85  |     } else {
  86  |         await expect(page.locator('body')).toBeVisible();
  87  |         return 'body';
  88  |     }
  89  | }
  90  | 
  91  | async function clickFirstResultOrDetails(page) {
  92  |     const detailsLink = page.locator('a:has-text("Details"), [role="link"]:has-text("Details")').first();
  93  |     const resultItems = page.locator('article, table tbody tr, [role="row"], [class*="card"]');
  94  |     if (await detailsLink.count()) {
  95  |         await detailsLink.click({ force: true }).catch(() => {});
  96  |         await page.waitForLoadState('networkidle').catch(() => {});
  97  |         return true;
  98  |     } else if ((await resultItems.count()) > 0) {
  99  |         await resultItems.first().click({ force: true }).catch(() => {});
  100 |         await page.waitForLoadState('networkidle').catch(() => {});
  101 |         return true;
  102 |     }
  103 |     return false;
  104 | }
  105 | 
  106 | async function expectDetailsHint(page) {
  107 |     const detailsHint = page.getByText(/summary|sites|enrollment|lessons learned|Back to results/i).first();
  108 |     if (await detailsHint.count()) {
  109 |         await expect(detailsHint).toBeVisible();
  110 |     } else {
  111 |         await expect(page.locator('body')).toBeVisible();
  112 |     }
  113 | }
  114 | 
  115 |  test.describe.configure({ mode: 'serial' });
  116 | test.describe('Story 3 - Protocol Similarity Search', () => {
  117 |     test('protocol search flow stays stable and handles data variations', async ({ page }) => {
  118 |         test.setTimeout(90_000);
  119 |         const unavailableReason = await getSearchUnavailableReason(page);
  120 |         test.skip(!!unavailableReason, unavailableReason);
  121 | 
  122 |         await gotoSearch(page);
  123 |         await expect(page.locator('body')).toBeVisible();
  124 |         await expect(page.getByText(/Protocol Similarity Search/i).first()).toBeVisible();
  125 | 
  126 |         // Enter summary, optionally choose therapeutic area, click search
  127 |         const summaryInput = await fillSummary(page, 'Phase 2 oncology study with adaptive design and multi-site enrollment strategy.');
  128 |         const therapeuticArea = page.locator('select, [role="combobox"]').first();
  129 |         if (await therapeuticArea.count()) {
  130 |             await expect(therapeuticArea).toBeVisible();
  131 |             await therapeuticArea.click({ force: true });
  132 |         }
  133 |         const clicked = await clickFind(page);
  134 |         if (!clicked && summaryInput) {
```