# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.js >> Study Portfolio Dashboard >> table toggle shows table with all required columns
- Location: tests\dashboard.spec.js:56:3

# Error details

```
"beforeAll" hook timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - main [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - img [ref=e7]
        - generic [ref=e9]: Flight Deck
      - generic [ref=e10]:
        - generic [ref=e11]:
          - generic [ref=e12]:
            - img [ref=e13]
            - text: Clinical Trials Intelligence
          - heading "Pilot every protocol with precision" [level=1] [ref=e16]:
            - text: Pilot every protocol
            - text: with precision
          - paragraph [ref=e17]: Flight Deck is the operating cockpit for clinical operations teams. Turn enrollment signals, site performance, and protocol risk into the decisions that move medicine forward — from first patient in to final readout.
          - list [ref=e18]:
            - listitem [ref=e19]:
              - img [ref=e21]
              - generic [ref=e26]:
                - paragraph [ref=e27]: Unified portfolio
                - paragraph [ref=e28]: Track every study, site, and milestone across regions in one live workspace.
            - listitem [ref=e29]:
              - img [ref=e31]
              - generic [ref=e33]:
                - paragraph [ref=e34]: Real-time signals
                - paragraph [ref=e35]: Enrollment velocity, screen-fail rates, and risk scores updated as data arrives.
            - listitem [ref=e36]:
              - img [ref=e38]
              - generic [ref=e41]:
                - paragraph [ref=e42]: Protocol intelligence
                - paragraph [ref=e43]: Search 100k+ protocols and benchmark designs against your therapeutic area.
        - generic [ref=e45]:
          - heading "Sign in" [level=2] [ref=e46]
          - paragraph [ref=e47]: Enter your credentials to access Flight Deck.
          - generic [ref=e48]:
            - generic [ref=e49]:
              - text: Username
              - textbox "Username" [ref=e50]:
                - /placeholder: Enter your username
            - generic [ref=e51]:
              - text: Password
              - generic [ref=e52]:
                - textbox "Password" [ref=e53]:
                  - /placeholder: ••••••••
                - button "Show password" [ref=e54]:
                  - img [ref=e55]
            - button "Sign in" [ref=e58]
  - region "Notifications alt+T"
```

# Test source

```ts
  1   | const { test, expect } = require('../utils/stepTest');
  2   | const { EXPECTED_COLUMNS } = require('../fixtures/dashboardData');
  3   | const { setupAuthenticatedStudyPortfolio, openStudyPortfolio } = require('../utils/authNavigation');
  4   | 
  5   | const BASE_URL = 'https://spend-mhz-bufing-characteristics.trycloudflare.com';
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
  36  |   const openDashboard = async () => {
  37  |     await openStudyPortfolio(page, { baseUrl: BASE_URL });
  38  |     await page.waitForLoadState('networkidle').catch(() => {});
  39  |     await expect(page.getByRole('heading', { name: DASHBOARD_HEADING })).toBeVisible();
  40  |   };
  41  | 
> 42  |   test.beforeAll(async ({ browser }) => {
      |        ^ "beforeAll" hook timeout of 30000ms exceeded.
  43  |     context = await browser.newContext();
  44  |     page = await context.newPage();
  45  |     await setupAuthenticatedStudyPortfolio(page, { baseUrl: BASE_URL });
  46  |   });
  47  | 
  48  |   test.beforeEach(async () => {
  49  |     await openDashboard();
  50  |   });
  51  | 
  52  |   test.afterAll(async () => {
  53  |     await context.close();
  54  |   });
  55  | 
  56  |   test('table toggle shows table with all required columns', async () => {
  57  |     await openTableView();
  58  | 
  59  |     const table = page.locator('table, [role="table"]').first();
  60  |     if (!(await table.isVisible().catch(() => false))) {
  61  |       await expect(getEmptyStateIndicator()).toBeVisible();
  62  |       return;
  63  |     }
  64  | 
  65  |     const tableHeaders = await page.locator('table thead th').allInnerTexts();
  66  |     const normalizedHeaders = tableHeaders.map((header) => header.replace(/\s+/g, ' ').trim().toLowerCase());
  67  | 
  68  |     for (const expectedColumn of EXPECTED_COLUMNS) {
  69  |       expect(normalizedHeaders).toContain(expectedColumn.toLowerCase());
  70  |       await expect(
  71  |         page
  72  |           .getByRole('columnheader', {
  73  |             name: new RegExp(`^${expectedColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  74  |           })
  75  |           .first()
  76  |       ).toBeVisible();
  77  |     }
  78  |   });
  79  | 
  80  |   test('search works without breaking', async () => {
  81  |     const search = page
  82  |       .getByPlaceholder('Search by ID, title...')
  83  |       .or(page.locator('input[placeholder*="Search"], input[type="search"], input').first())
  84  |       .first();
  85  | 
  86  |     await expect(search).toBeVisible();
  87  |     await search.fill('ST-2024-003');
  88  |     await search.press('Enter');
  89  | 
  90  |     const hasResults = (await page.getByRole('link', { name: /ST-\d{4}-\d{3}/ }).count()) > 0;
  91  |     if (!hasResults) {
  92  |       await expect(page.getByText(/No Studies Found|0 loaded/i).first()).toBeVisible();
  93  |     } else {
  94  |       await expect(page.getByRole('link', { name: /ST-\d{4}-\d{3}/ }).first()).toBeVisible();
  95  |     }
  96  |   });
  97  | 
  98  |   test('filters basic interaction does not break', async () => {
  99  |     const possibleFilters = ['Therapeutic Area', 'Phase', 'Study Status'];
  100 | 
  101 |     let interacted = false;
  102 |     for (const name of possibleFilters) {
  103 |       const filterBtn = page.getByRole('button', { name }).first();
  104 |       if (await filterBtn.isVisible().catch(() => false)) {
  105 |         await filterBtn.click();
  106 |         await expect(filterBtn).toBeVisible();
  107 |         interacted = true;
  108 |         break;
  109 |       }
  110 |     }
  111 | 
  112 |     expect(interacted).toBeTruthy();
  113 |   });
  114 | 
  115 |   test('sorting click works when header exists', async () => {
  116 |     await openTableView();
  117 |     const table = page.locator('table, [role="table"]').first();
  118 |     if (!(await table.isVisible().catch(() => false))) {
  119 |       await expect(getEmptyStateIndicator()).toBeVisible();
  120 |       return;
  121 |     }
  122 | 
  123 |     const sortableInTable = table.getByRole('button', { name: /Study ID|Phase|Status/i }).first();
  124 |     const headerCellInTable = table.getByRole('columnheader', { name: /Study ID|Phase|Status/i }).first();
  125 | 
  126 |     const useButton = await sortableInTable.isVisible().catch(() => false);
  127 |     const target = useButton ? sortableInTable : headerCellInTable;
  128 | 
  129 |     if (!(await target.isVisible().catch(() => false))) {
  130 |       await expect(table).toBeVisible();
  131 |       return;
  132 |     }
  133 | 
  134 |     await target.click({ force: true });
  135 |     await expect(target).toBeVisible();
  136 |   });
  137 | 
  138 |   test('empty state handled safely', async () => {
  139 |     const search = page
  140 |       .getByPlaceholder('Search by ID, title...')
  141 |       .or(page.locator('input[placeholder*="Search"], input[type="search"], input').first())
  142 |       .first();
```