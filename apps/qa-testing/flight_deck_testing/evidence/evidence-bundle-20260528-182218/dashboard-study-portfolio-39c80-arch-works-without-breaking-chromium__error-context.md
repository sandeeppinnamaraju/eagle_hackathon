# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.js >> Study Portfolio Dashboard >> search works without breaking
- Location: tests\dashboard.spec.js:85:3

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
  - text: "??"
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
  - link "ST-2024-003 Ph II Medium On Track Novel Magnetic Resonance Imaging-Guided Ultrasound-Stimulated Microbubble Radiation Treatment for Patients With Chest-Wall and Locally Advanced Breast Cancer-Phase II Breast Cancer · Oncology CRX-716 42 enrolled 106.52% of 200 6-month trend 5 countries 14 sites Status Recruiting Portfolio Oncology Portfolio":
    - /url: /studies/ST-2024-003
    - text: ST-2024-003 Ph II Medium On Track
    - heading "Novel Magnetic Resonance Imaging-Guided Ultrasound-Stimulated Microbubble Radiation Treatment for Patients With Chest-Wall and Locally Advanced Breast Cancer-Phase II" [level=3]
    - paragraph: Breast Cancer · Oncology
    - paragraph: CRX-716
    - text: 42 enrolled 106.52% of 200
    - paragraph: 6-month trend
    - img
    - text: 5 countries 14 sites
    - paragraph: Status
    - paragraph: Recruiting
    - paragraph: Portfolio
    - paragraph: Oncology Portfolio
```

# Test source

```ts
  1   | const { test, expect } = require('../utils/stepTest');
  2   | const { EXPECTED_COLUMNS } = require('../fixtures/dashboardData');
  3   | const { setupAuthenticatedStudyPortfolio } = require('../utils/authNavigation');
  4   | 
  5   | const BASE_URL = 'https://eagle-frontend01-hpe9hhhngdc9addx.centralus-01.azurewebsites.net/'; // username: eagle_user1, password: FD_hack@user1
  6   | 
  7   | test.describe('Study Portfolio Dashboard', () => {
  8   |   test.describe.configure({ mode: 'serial', timeout: 90_000 });
  9   | 
  10  |   let context;
  11  |   let page;
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
  22  |   const waitForStudiesToSettle = async () => {
  23  |     const loadingText = page.getByText(/Loading studies\.\.\./i).first();
  24  |     if (await loadingText.isVisible().catch(() => false)) {
  25  |       await expect(loadingText).toBeHidden({ timeout: 30_000 });
  26  |     }
  27  |   };
  28  | 
  29  |   const openTableView = async () => {
  30  |     const tableButton = page.getByRole('button', { name: 'Table' }).first();
  31  |     await expect(tableButton).toBeVisible();
  32  |     await tableButton.click();
  33  |     await waitForStudiesToSettle();
  34  |   };
  35  | 
  36  | 
  37  | 
  38  |   const openDashboard = async () => {
  39  |     await setupAuthenticatedStudyPortfolio(page, { baseUrl: BASE_URL });
  40  |     await page.waitForLoadState('networkidle').catch(() => {});
  41  |     await expect(page.getByRole('heading', { name: DASHBOARD_HEADING })).toBeVisible();
  42  |   };
  43  | 
  44  | 
  45  | 
  46  |   test.beforeAll(async ({ browser }) => {
  47  |     test.setTimeout(120_000);
  48  |     context = await browser.newContext();
  49  |     page = await context.newPage();
  50  |     await setupAuthenticatedStudyPortfolio(page, { baseUrl: BASE_URL });
  51  |   });
  52  | 
  53  |   test.beforeEach(async () => {
  54  |     await openDashboard();
  55  |   });
  56  | 
  57  |   test.afterAll(async () => {
  58  |     await context.close();
  59  |   });
  60  | 
  61  |   test('table toggle shows table with all required columns', async () => {
  62  |     await openTableView();
  63  | 
  64  |     const table = page.locator('table, [role="table"]').first();
  65  |     if (!(await table.isVisible().catch(() => false))) {
  66  |       await expect(getEmptyStateIndicator()).toBeVisible();
  67  |       return;
  68  |     }
  69  | 
  70  |     const tableHeaders = await page.locator('table thead th').allInnerTexts();
  71  |     const normalizedHeaders = tableHeaders.map((header) => header.replace(/\s+/g, ' ').trim().toLowerCase());
  72  | 
  73  |     for (const expectedColumn of EXPECTED_COLUMNS) {
  74  |       expect(normalizedHeaders).toContain(expectedColumn.toLowerCase());
  75  |       await expect(
  76  |         page
  77  |           .getByRole('columnheader', {
  78  |             name: new RegExp(`^${expectedColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  79  |           })
  80  |           .first()
  81  |       ).toBeVisible();
  82  |     }
  83  |   });
  84  | 
  85  |   test('search works without breaking', async () => {
  86  |     const search = page
  87  |       .getByPlaceholder('Search by ID, title...')
  88  |       .or(page.locator('input[placeholder*="Search"], input[type="search"], input').first())
  89  |       .first();
  90  | 
  91  |     await expect(search).toBeVisible();
  92  |     await search.fill('ST-2024-003');
  93  |     await search.press('Enter');
  94  |     await page.waitForLoadState('networkidle');
  95  | 
  96  |     const hasResults = (await page.getByRole('link', { name: /ST-\d{4}-\d{3}/ }).count()) > 0;
  97  |     if (!hasResults) {
> 98  |       await expect(page.getByText(/No Studies Found|0 loaded/i).first()).toBeVisible();
      |                                                                          ^ Error: expect(locator).toBeVisible() failed
  99  |     } else {
  100 |       await expect(page.getByRole('link', { name: /ST-\d{4}-\d{3}/ }).first()).toBeVisible();
  101 |     }
  102 |   });
  103 | 
  104 |   test('filters basic interaction does not break', async () => {
  105 |     const possibleFilters = ['Therapeutic Area', 'Phase', 'Study Status'];
  106 | 
  107 |     let interacted = false;
  108 |     for (const name of possibleFilters) {
  109 |       const filterBtn = page.getByRole('button', { name }).first();
  110 |       if (await filterBtn.isVisible().catch(() => false)) {
  111 |         await filterBtn.click();
  112 |         await expect(filterBtn).toBeVisible();
  113 |         interacted = true;
  114 |         break;
  115 |       }
  116 |     }
  117 | 
  118 |     expect(interacted).toBeTruthy();
  119 |   });
  120 | 
  121 |   test('sorting click works when header exists', async () => {
  122 |     await openTableView();
  123 |     const table = page.locator('table, [role="table"]').first();
  124 |     if (!(await table.isVisible().catch(() => false))) {
  125 |       await expect(getEmptyStateIndicator()).toBeVisible();
  126 |       return;
  127 |     }
  128 | 
  129 |     const sortableInTable = table.getByRole('button', { name: /Study ID|Phase|Status/i }).first();
  130 |     const headerCellInTable = table.getByRole('columnheader', { name: /Study ID|Phase|Status/i }).first();
  131 | 
  132 |     const useButton = await sortableInTable.isVisible().catch(() => false);
  133 |     const target = useButton ? sortableInTable : headerCellInTable;
  134 | 
  135 |     if (!(await target.isVisible().catch(() => false))) {
  136 |       await expect(table).toBeVisible();
  137 |       return;
  138 |     }
  139 | 
  140 |     await target.click({ force: true });
  141 |     await expect(target).toBeVisible();
  142 |   });
  143 | 
  144 |   test('empty state handled safely', async () => {
  145 |     const search = page
  146 |       .getByPlaceholder('Search by ID, title...')
  147 |       .or(page.locator('input[placeholder*="Search"], input[type="search"], input').first())
  148 |       .first();
  149 | 
  150 |     await search.fill('ZZZZ-NO-DATA-999999');
  151 |     await search.press('Enter');
  152 | 
  153 |     const noData = page.getByText(/No Studies Found|No data/i).first();
  154 |     if (await noData.count()) {
  155 |       await expect(noData).toBeVisible();
  156 |     } else {
  157 |       await expect(page.getByText(/Showing\s+0\s+of\s+0\s+studies|0\s+of\s+0\s+studies|0\s+loaded|loaded/i).first()).toBeVisible();
  158 |     }
  159 |   });
  160 | 
  161 |   test('table view is visible and handles rows or empty state', async () => {
  162 |     await openTableView();
  163 | 
  164 |     const table = page.locator('table, [role="table"]').first();
  165 |     if (!(await table.isVisible().catch(() => false))) {
  166 |       await expect(getEmptyStateIndicator()).toBeVisible();
  167 |       return;
  168 |     }
  169 | 
  170 |     const rows = page.locator('table tbody tr, [role="rowgroup"] [role="row"]');
  171 |     const rowCount = await rows.count().catch(() => 0);
  172 | 
  173 |     if (rowCount > 0) {
  174 |       await expect(rows.first()).toBeVisible();
  175 |     } else {
  176 |       await expect(getEmptyStateIndicator()).toBeVisible();
  177 |     }
  178 |   });
  179 | 
  180 |   test('valid search shows a matching study or safe empty state', async () => {
  181 |     const search = getSearchInput();
  182 |     await expect(search).toBeVisible();
  183 | 
  184 |     await search.fill('ST-2024-003');
  185 |     await search.press('Enter');
  186 |     await page.waitForLoadState('networkidle').catch(() => {});
  187 | 
  188 |     const matchingStudy = getStudyLinks().filter({ hasText: /ST-2024-003/i }).first();
  189 |     if (await matchingStudy.isVisible().catch(() => false)) {
  190 |       await expect(matchingStudy).toBeVisible();
  191 |     } else {
  192 |       await expect(getEmptyStateIndicator()).toBeVisible();
  193 |     }
  194 |   });
  195 | 
  196 |   test('partial search behaves safely', async () => {
  197 |     const search = getSearchInput();
  198 |     await expect(search).toBeVisible();
```