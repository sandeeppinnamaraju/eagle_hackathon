# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.js >> Study Portfolio Dashboard >> search works without breaking
- Location: tests\dashboard.spec.js:100:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/No Studies Found|0 loaded/i).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/No Studies Found|0 loaded/i).first()

```

```yaml
- banner:
  - link "Flight Deck":
    - /url: /home
  - navigation:
    - link "Home":
      - /url: /home
    - link "Study Portfolio":
      - /url: /portfolio
    - link "Protocol Search":
      - /url: /protocol-search
  - text: VIEWER ea Eagle_user1 User
  - button "Sign out"
- main:
  - heading "Study Portfolio Dashboard" [level=1]
  - button "5 Insights"
  - textbox "Search by ID, title, indication...": ST-2024-003
  - paragraph: Showing 1 of 1 studies
  - button "Therapeutic Area"
  - combobox: Phase
  - combobox: Study Status
  - combobox: Portfolio
  - combobox: Program
  - combobox: Region
  - button "FPI / LPO"
  - button "Clear all"
  - paragraph: Active Studies
  - paragraph: "1"
  - paragraph: recruiting or follow-up
  - paragraph: On Track
  - paragraph: 100.0%
  - paragraph: 1 of 1 active
  - paragraph: At Risk / Off Track
  - paragraph: 0.0%
  - paragraph: 0 of 1 active
  - paragraph: Enrollment vs Target
  - paragraph: 21.0%
  - paragraph: 42 of 200 patients
  - img
  - paragraph: Enrollment vs Plan (To Date)
  - paragraph: 21.0%
  - paragraph: 42 of 200 planned
  - paragraph: Velocity vs Plan
  - paragraph: 106.5%
  - paragraph: avg enrollment speed
  - button "Cards"
  - button "Table"
  - table:
    - rowgroup:
      - row "Study ID Phase Therapeutic Area Indication Portfolio / Program Status Priority Target Actual % vs Plan Countries Sites Performance":
        - columnheader "Study ID":
          - button "Study ID"
        - columnheader "Phase":
          - button "Phase"
        - columnheader "Therapeutic Area":
          - button "Therapeutic Area"
        - columnheader "Indication":
          - button "Indication"
        - columnheader "Portfolio / Program":
          - button "Portfolio / Program"
        - columnheader "Status":
          - button "Status"
        - columnheader "Priority":
          - button "Priority"
        - columnheader "Target":
          - button "Target"
        - columnheader "Actual":
          - button "Actual"
        - columnheader "% vs Plan":
          - button "% vs Plan"
        - columnheader "Countries":
          - button "Countries"
        - columnheader "Sites":
          - button "Sites"
        - columnheader "Performance":
          - button "Performance"
    - rowgroup:
      - row "ST-2024-003 Ph II Oncology Breast Cancer Oncology Portfolio / CRX-716 Recruiting Medium 200 42 106.52% 5 14 On Track":
        - cell "ST-2024-003":
          - link "ST-2024-003":
            - /url: /studies/ST-2024-003
        - cell "Ph II"
        - cell "Oncology"
        - cell "Breast Cancer"
        - cell "Oncology Portfolio / CRX-716"
        - cell "Recruiting"
        - cell "Medium"
        - cell "200"
        - cell "42"
        - cell "106.52%"
        - cell "5"
        - cell "14"
        - cell "On Track"
  - paragraph: 1 loaded • 1 total
- region "Notifications alt+T"
```

# Test source

```ts
  12  | 
  13  |   const DASHBOARD_HEADING = /Study Portfolio Dashboard|Portfolio Dashboard/i;
  14  | 
  15  |   const getSearchInput = () => page.locator('input[placeholder*="Search"], input[type="search"], input').first();
  16  | 
  17  |   const getEmptyStateIndicator = () =>
  18  |     page.getByText(/No Studies Found|No data|Showing\s+0\s+of\s+0\s+studies|0\s+of\s+0\s+studies|0\s+loaded/i).first();
  19  | 
  20  |   const getStudyLinks = () => page.locator('a[href*="/studies/"]');
  21  | 
  22  |   const waitForStudiesToSettle = async ({ timeout = 15_000 } = {}) => {
  23  |     const loadingText = page.getByText(/Loading studies\.\.\./i).first();
  24  | 
  25  |     if (!(await loadingText.isVisible().catch(() => false))) {
  26  |       return true;
  27  |     }
  28  | 
  29  |     const settled = await loadingText
  30  |       .waitFor({ state: 'hidden', timeout })
  31  |       .then(() => true)
  32  |       .catch(() => false);
  33  | 
  34  |     return settled;
  35  |   };
  36  | 
  37  |   const openTableView = async () => {
  38  |     const tableButton = page.getByRole('button', { name: 'Table' }).first();
  39  |     await expect(tableButton).toBeVisible();
  40  |     await tableButton.click();
  41  | 
  42  |     const settled = await waitForStudiesToSettle();
  43  |     if (!settled) {
  44  |       const cardsButton = page.getByRole('button', { name: 'Cards' }).first();
  45  |       if (await cardsButton.isVisible().catch(() => false)) {
  46  |         await cardsButton.click().catch(() => {});
  47  |         await page.waitForLoadState('networkidle').catch(() => {});
  48  |       }
  49  | 
  50  |       await tableButton.click().catch(() => {});
  51  |       await waitForStudiesToSettle({ timeout: 10_000 });
  52  |     }
  53  |   };
  54  | 
  55  |   const openDashboard = async () => {
  56  |     await openStudyPortfolio(page, { baseUrl: BASE_URL });
  57  |     await page.waitForLoadState('networkidle').catch(() => {});
  58  |     await expect(page.getByRole('heading', { name: DASHBOARD_HEADING })).toBeVisible();
  59  |   };
  60  | 
  61  |   test.beforeAll(async ({ browser }) => {
  62  |     test.setTimeout(120_000);
  63  |     context = await browser.newContext();
  64  |     page = await context.newPage();
  65  |     await setupAuthenticatedStudyPortfolio(page, { baseUrl: BASE_URL });
  66  |   });
  67  | 
  68  |   test.beforeEach(async () => {
  69  |     await openDashboard();
  70  |   });
  71  | 
  72  |   test.afterAll(async () => {
  73  |     await context.close();
  74  |   });
  75  | 
  76  |   test('table toggle shows table with all required columns', async () => {
  77  |     await openTableView();
  78  | 
  79  |     const table = page.locator('table, [role="table"]').first();
  80  |     if (!(await table.isVisible().catch(() => false))) {
  81  |       await expect(getEmptyStateIndicator()).toBeVisible();
  82  |       return;
  83  |     }
  84  | 
  85  |     const tableHeaders = await page.locator('table thead th').allInnerTexts();
  86  |     const normalizedHeaders = tableHeaders.map((header) => header.replace(/\s+/g, ' ').trim().toLowerCase());
  87  | 
  88  |     for (const expectedColumn of EXPECTED_COLUMNS) {
  89  |       expect(normalizedHeaders).toContain(expectedColumn.toLowerCase());
  90  |       await expect(
  91  |         page
  92  |           .getByRole('columnheader', {
  93  |             name: new RegExp(`^${expectedColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  94  |           })
  95  |           .first()
  96  |       ).toBeVisible();
  97  |     }
  98  |   });
  99  | 
  100 |   test('search works without breaking', async () => {
  101 |     const search = page
  102 |       .getByPlaceholder('Search by ID, title...')
  103 |       .or(page.locator('input[placeholder*="Search"], input[type="search"], input').first())
  104 |       .first();
  105 | 
  106 |     await expect(search).toBeVisible();
  107 |     await search.fill('ST-2024-003');
  108 |     await search.press('Enter');
  109 | 
  110 |     const hasResults = (await page.getByRole('link', { name: /ST-\d{4}-\d{3}/ }).count()) > 0;
  111 |     if (!hasResults) {
> 112 |       await expect(page.getByText(/No Studies Found|0 loaded/i).first()).toBeVisible();
      |                                                                          ^ Error: expect(locator).toBeVisible() failed
  113 |     } else {
  114 |       await expect(page.getByRole('link', { name: /ST-\d{4}-\d{3}/ }).first()).toBeVisible();
  115 |     }
  116 |   });
  117 | 
  118 |   test('filters basic interaction does not break', async () => {
  119 |     const possibleFilters = ['Therapeutic Area', 'Phase', 'Study Status'];
  120 | 
  121 |     let interacted = false;
  122 |     for (const name of possibleFilters) {
  123 |       const filterBtn = page.getByRole('button', { name }).first();
  124 |       if (await filterBtn.isVisible().catch(() => false)) {
  125 |         await filterBtn.click();
  126 |         await expect(filterBtn).toBeVisible();
  127 |         interacted = true;
  128 |         break;
  129 |       }
  130 |     }
  131 | 
  132 |     expect(interacted).toBeTruthy();
  133 |   });
  134 | 
  135 |   test('sorting click works when header exists', async () => {
  136 |     await openTableView();
  137 |     const table = page.locator('table, [role="table"]').first();
  138 |     if (!(await table.isVisible().catch(() => false))) {
  139 |       await expect(getEmptyStateIndicator()).toBeVisible();
  140 |       return;
  141 |     }
  142 | 
  143 |     const sortableInTable = table.getByRole('button', { name: /Study ID|Phase|Status/i }).first();
  144 |     const headerCellInTable = table.getByRole('columnheader', { name: /Study ID|Phase|Status/i }).first();
  145 | 
  146 |     const useButton = await sortableInTable.isVisible().catch(() => false);
  147 |     const target = useButton ? sortableInTable : headerCellInTable;
  148 | 
  149 |     if (!(await target.isVisible().catch(() => false))) {
  150 |       await expect(table).toBeVisible();
  151 |       return;
  152 |     }
  153 | 
  154 |     await target.click({ force: true });
  155 |     await expect(target).toBeVisible();
  156 |   });
  157 | 
  158 |   test('empty state handled safely', async () => {
  159 |     const search = page
  160 |       .getByPlaceholder('Search by ID, title...')
  161 |       .or(page.locator('input[placeholder*="Search"], input[type="search"], input').first())
  162 |       .first();
  163 | 
  164 |     await search.fill('ZZZZ-NO-DATA-999999');
  165 |     await search.press('Enter');
  166 | 
  167 |     const noData = page.getByText(/No Studies Found|No data/i).first();
  168 |     if (await noData.count()) {
  169 |       await expect(noData).toBeVisible();
  170 |     } else {
  171 |       await expect(page.getByText(/Showing\s+0\s+of\s+0\s+studies|0\s+of\s+0\s+studies|0\s+loaded|loaded/i).first()).toBeVisible();
  172 |     }
  173 |   });
  174 | 
  175 |   test('table view is visible and handles rows or empty state', async () => {
  176 |     await openTableView();
  177 | 
  178 |     const table = page.locator('table, [role="table"]').first();
  179 |     if (!(await table.isVisible().catch(() => false))) {
  180 |       await expect(getEmptyStateIndicator()).toBeVisible();
  181 |       return;
  182 |     }
  183 | 
  184 |     const rows = page.locator('table tbody tr, [role="rowgroup"] [role="row"]');
  185 |     const rowCount = await rows.count().catch(() => 0);
  186 | 
  187 |     if (rowCount > 0) {
  188 |       await expect(rows.first()).toBeVisible();
  189 |     } else {
  190 |       await expect(getEmptyStateIndicator()).toBeVisible();
  191 |     }
  192 |   });
  193 | 
  194 |   test('valid search shows a matching study or safe empty state', async () => {
  195 |     const search = getSearchInput();
  196 |     await expect(search).toBeVisible();
  197 | 
  198 |     await search.fill('ST-2024-003');
  199 |     await search.press('Enter');
  200 |     await page.waitForLoadState('networkidle').catch(() => {});
  201 | 
  202 |     const matchingStudy = getStudyLinks().filter({ hasText: /ST-2024-003/i }).first();
  203 |     if (await matchingStudy.isVisible().catch(() => false)) {
  204 |       await expect(matchingStudy).toBeVisible();
  205 |     } else {
  206 |       await expect(getEmptyStateIndicator()).toBeVisible();
  207 |     }
  208 |   });
  209 | 
  210 |   test('partial search behaves safely', async () => {
  211 |     const search = getSearchInput();
  212 |     await expect(search).toBeVisible();
```