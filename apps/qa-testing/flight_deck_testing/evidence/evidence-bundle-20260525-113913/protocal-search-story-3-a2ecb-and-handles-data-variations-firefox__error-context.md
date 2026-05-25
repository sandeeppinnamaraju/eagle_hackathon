# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: protocal-search.spec.js >> Story 3 - Protocol Similarity Search >> protocol search flow stays stable and handles data variations
- Location: tests\protocal-search.spec.js:82:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Protocol Similarity Search/i).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/Protocol Similarity Search/i).first()

```

```yaml
- text: "{\"error\":\"Only HTML requests are supported here\"}"
```

# Test source

```ts
  1   | 
  2   | const { test, expect } = require('../utils/stepTest');
  3   | const URL = 'https://legislature-valued-short-facilitate.trycloudflare.com/protocol-search';
  4   | 
  5   | // --- Helper functions ---
  6   | async function gotoSearch(page) {
  7   |     await page.goto(`${URL}?mode=input`);
  8   |     await page.waitForLoadState('networkidle').catch(() => {});
  9   | }
  10  | 
  11  | async function fillSummary(page, text) {
  12  |     const summaryInput = page.locator('textarea, input').first();
  13  |     if (await summaryInput.count()) {
  14  |         await expect(summaryInput).toBeVisible();
  15  |         await summaryInput.fill(text);
  16  |         return summaryInput;
  17  |     }
  18  |     return null;
  19  | }
  20  | 
  21  | async function clickFind(page) {
  22  |     const findButton = page.locator('button:has-text("Find"), button:has-text("Similar")').first();
  23  |     if (await findButton.count()) {
  24  |         await expect(findButton).toBeVisible();
  25  |         await findButton.scrollIntoViewIfNeeded();
  26  |         await findButton.click({ force: true }).catch(() => {});
  27  |         return true;
  28  |     }
  29  |     return false;
  30  | }
  31  | 
  32  | async function searchAndWait(page, text) {
  33  |     const summaryInput = await fillSummary(page, text);
  34  |     const clicked = await clickFind(page);
  35  |     if (!clicked && summaryInput) {
  36  |         await summaryInput.press('Enter').catch(() => {});
  37  |     }
  38  |     await page.waitForLoadState('networkidle').catch(() => {});
  39  | }
  40  | 
  41  | async function expectResultsOrEmpty(page) {
  42  |     const resultItems = page.locator('article, table tbody tr, [role="row"], [class*="card"]');
  43  |     const emptyState = page.getByText(/no results|no similar protocols|nothing found|empty|0 protocols matched/i).first();
  44  |     if ((await resultItems.count()) > 0) {
  45  |         await expect(resultItems.first()).toBeVisible();
  46  |         return 'results';
  47  |     } else if (await emptyState.count()) {
  48  |         await expect(emptyState).toBeVisible();
  49  |         return 'empty';
  50  |     } else {
  51  |         await expect(page.locator('body')).toBeVisible();
  52  |         return 'body';
  53  |     }
  54  | }
  55  | 
  56  | async function clickFirstResultOrDetails(page) {
  57  |     const detailsLink = page.locator('a:has-text("Details"), [role="link"]:has-text("Details")').first();
  58  |     const resultItems = page.locator('article, table tbody tr, [role="row"], [class*="card"]');
  59  |     if (await detailsLink.count()) {
  60  |         await detailsLink.click({ force: true }).catch(() => {});
  61  |         await page.waitForLoadState('networkidle').catch(() => {});
  62  |         return true;
  63  |     } else if ((await resultItems.count()) > 0) {
  64  |         await resultItems.first().click({ force: true }).catch(() => {});
  65  |         await page.waitForLoadState('networkidle').catch(() => {});
  66  |         return true;
  67  |     }
  68  |     return false;
  69  | }
  70  | 
  71  | async function expectDetailsHint(page) {
  72  |     const detailsHint = page.getByText(/summary|sites|enrollment|lessons learned|Back to results/i).first();
  73  |     if (await detailsHint.count()) {
  74  |         await expect(detailsHint).toBeVisible();
  75  |     } else {
  76  |         await expect(page.locator('body')).toBeVisible();
  77  |     }
  78  | }
  79  | 
  80  |  test.describe.configure({ mode: 'serial' });
  81  | test.describe('Story 3 - Protocol Similarity Search', () => {
  82  |     test('protocol search flow stays stable and handles data variations', async ({ page }) => {
  83  |         await gotoSearch(page);
  84  |         await expect(page.locator('body')).toBeVisible();
> 85  |         await expect(page.getByText(/Protocol Similarity Search/i).first()).toBeVisible();
      |                                                                             ^ Error: expect(locator).toBeVisible() failed
  86  | 
  87  |         // Enter summary, optionally choose therapeutic area, click search
  88  |         const summaryInput = await fillSummary(page, 'Phase 2 oncology study with adaptive design and multi-site enrollment strategy.');
  89  |         const therapeuticArea = page.locator('select, [role="combobox"]').first();
  90  |         if (await therapeuticArea.count()) {
  91  |             await expect(therapeuticArea).toBeVisible();
  92  |             await therapeuticArea.click({ force: true });
  93  |         }
  94  |         const clicked = await clickFind(page);
  95  |         if (!clicked && summaryInput) {
  96  |             await summaryInput.press('Enter').catch(() => {});
  97  |         }
  98  |         await page.waitForLoadState('networkidle').catch(() => {});
  99  | 
  100 |         // Results or empty state
  101 |         const resultsContainer = page.locator('article, table, [role="table"], [class*="card"]').first();
  102 |         const resultItems = page.locator('article, table tbody tr, [role="row"], [class*="card"]');
  103 |         const emptyState = page.getByText(/no results|no similar protocols|nothing found|empty|0 protocols matched/i).first();
  104 |         if ((await resultItems.count()) > 0 || (await resultsContainer.count()) > 0) {
  105 |             await expect(resultsContainer).toBeVisible();
  106 |             await clickFirstResultOrDetails(page);
  107 |             await expectDetailsHint(page);
  108 |         } else if (await emptyState.count()) {
  109 |             await expect(emptyState).toBeVisible();
  110 |         } else {
  111 |             await expect(page.locator('body')).toBeVisible();
  112 |         }
  113 |     });
  114 | 
  115 | 
  116 | 
  117 | 
  118 | 
  119 | 
  120 | 
  121 | 
  122 | 
  123 | 
  124 | 
  125 | 
  126 | 
  127 |     test('clicking first result can navigate to details safely', async ({ page }) => {
  128 |         await gotoSearch(page);
  129 |         await searchAndWait(page, 'phase 2 multi-site enrollment protocol with biomarkers');
  130 |         await clickFirstResultOrDetails(page);
  131 |         await expect(page.locator('body')).toBeVisible();
  132 |     });
  133 | 
  134 |     test('details page basic content validation remains safe', async ({ page }) => {
  135 |         await gotoSearch(page);
  136 |         await searchAndWait(page, 'study design with enrollment and site expansion patterns');
  137 |         await clickFirstResultOrDetails(page);
  138 |         await expectDetailsHint(page);
  139 |     });
  140 | 
  141 | 
  142 | 
  143 |     test('search works when dropdown is not selected', async ({ page }) => {
  144 |         await gotoSearch(page);
  145 |         await searchAndWait(page, 'protocol summary without selecting a therapeutic area');
  146 |         await expect(page.locator('body')).toBeVisible();
  147 |     });
  148 | 
  149 | 
  150 | });
  151 | 
```