# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: story2-study-overview.spec.js >> Story 2 - Study Overview >> charts and time filters: chart sections render and filters are clickable
- Location: tests\story2-study-overview.spec.js:137:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('img').filter({ has: locator('..') }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('img').filter({ has: locator('..') }).first()

```

```yaml
- banner:
  - link "Flight Deck":
    - /url: /
  - navigation:
    - link "Study Portfolio":
      - /url: /
    - link "Study Overview":
      - /url: /studies
    - link "Protocol Search":
      - /url: /protocol-search
- main:
  - link "Back to Studies":
    - /url: /studies
  - text: ST-2024-002 Ph I Recruiting High Priority Off Track
  - heading "Phase I/II First-In-Human Open-label Trial to Assess Safety and Efficacy of STX-241 in Participants With Locally Advanced NSCLC" [level=1]
  - paragraph: Non-small Cell Lung Cancer (NSCLC) · Oncology · Oncology & Hematology
  - button "Milestones"
  - paragraph: Asset
  - paragraph: OMP-770
  - paragraph: Asset Lead
  - paragraph: Dr. Lisa Miller
  - paragraph: FSO Model
  - paragraph: Full Service Outsourcing (FSO) · Hybrid
  - paragraph: Study Sponsor
  - paragraph: ApexBio Research
  - paragraph: Designation
  - paragraph: Fast Track
  - paragraph: Target Enrollment
  - paragraph: "148"
  - paragraph: Planned FPI
  - paragraph: 28 Mar 2024
  - paragraph: Actual FPI
  - paragraph: 27 Mar 2024
  - paragraph: Planned LPI
  - paragraph: 30 Sept 2029
  - paragraph: Forecast LPI
  - paragraph: —
  - paragraph: Enrollment vs Plan
  - paragraph: 106.5%
  - text: "Actual: 49 Plan: 46"
  - paragraph: Enrollment Rate
  - paragraph: 0.5pts/wk
  - text: "Actual: 0.5 Plan: 0.4"
  - paragraph: Screen Failure Rate
  - paragraph: 17.3%
  - paragraph: Dropout Rate
  - paragraph: 3.6%
  - paragraph: Sites Activated
  - paragraph: 24/ 24
  - text: "Actual: 24 Plan: 24"
  - paragraph: Countries Activated
  - paragraph: 6/ 6
  - text: "Actual: 6 Plan: 6"
  - button "Full Study"
  - button "Since FPI"
  - button "Last 3 Months"
  - heading "CUMULATIVE ENROLLMENT" [level=3]
  - img: Mar 24 Oct 24 May 25 Dec 25 Jul 26 Feb 27 Sept 27 Apr 28 Nov 28 Jun 29 0 40 80 120 160
  - list:
    - listitem:
      - img
      - text: Actual
    - listitem:
      - img
      - text: Forecast
    - listitem:
      - img
      - text: Planned
  - heading "ENROLLMENT RATE (per month)" [level=3]
  - img: May 24 Jul 24 Nov 24 Jan 25 May 25 Jul 25 Nov 25 Jan 26 May 26 0 2 4 6 8
  - list:
    - listitem:
      - img
      - text: Actual
    - listitem:
      - img
      - text: Planned
  - paragraph: Red bars indicate periods below plan
  - button "By Country"
  - button "By Site"
  - button "Underperforming"
  - button "Overperforming"
  - heading "Country Breakdown" [level=3]
  - table:
    - rowgroup:
      - row "Country Target Actual % Enrolled Sites Active Avg Rate Status":
        - columnheader
        - columnheader "Country"
        - columnheader "Target"
        - columnheader "Actual"
        - columnheader "% Enrolled"
        - columnheader "Sites Active"
        - columnheader "Avg Rate"
        - columnheader "Status"
    - rowgroup:
      - row "Canada 31 27 87.1% 2 3.4 At Risk":
        - cell
        - cell "Canada"
        - cell "31"
        - cell "27"
        - cell "87.1%"
        - cell "2"
        - cell "3.4"
        - cell "At Risk"
      - row "France 18 0 0.0% 2 0.0 Off Track":
        - cell
        - cell "France"
        - cell "18"
        - cell "0"
        - cell "0.0%"
        - cell "2"
        - cell "0.0"
        - cell "Off Track"
      - row "Mexico 31 16 51.6% 5 0.9 Off Track":
        - cell
        - cell "Mexico"
        - cell "31"
        - cell "16"
        - cell "51.6%"
        - cell "5"
        - cell "0.9"
        - cell "Off Track"
      - row "New Zealand 22 0 0.0% 3 0.0 Off Track":
        - cell
        - cell "New Zealand"
        - cell "22"
        - cell "0"
        - cell "0.0%"
        - cell "3"
        - cell "0.0"
        - cell "Off Track"
      - row "South Korea 17 0 0.0% 6 0.0 Off Track":
        - cell
        - cell "South Korea"
        - cell "17"
        - cell "0"
        - cell "0.0%"
        - cell "6"
        - cell "0.0"
        - cell "Off Track"
      - row "Sweden 29 0 0.0% 6 0.0 Off Track":
        - cell
        - cell "Sweden"
        - cell "29"
        - cell "0"
        - cell "0.0%"
        - cell "6"
        - cell "0.0"
        - cell "Off Track"
```

# Test source

```ts
  44  |     await expect(firstStudyLink).toBeVisible();
  45  |     await firstStudyLink.click({ force: true });
  46  |     await page.waitForLoadState('networkidle').catch(() => {});
  47  |   };
  48  | 
  49  |   test.beforeAll(async ({ browser }) => {
  50  |     context = await browser.newContext();
  51  |     page = await context.newPage();
  52  |     await openDashboard();
  53  |   });
  54  | 
  55  |   test.afterAll(async () => {
  56  |     await context.close();
  57  |   });
  58  | 
  59  |   test('navigation: dashboard row click opens Study Overview detail page', async () => {
  60  |     await openFirstStudyDetailFromDashboard();
  61  | 
  62  |     await expect(page).toHaveURL(/\/studies\/ST-\d{4}-\d{3}/i);
  63  |     await expect(page.getByRole('link', { name: /Back to Studies/i })).toBeVisible();
  64  |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  65  |   });
  66  | 
  67  |   test('page load: Study Overview list renders with required columns', async () => {
  68  |     await goToStudiesList();
  69  | 
  70  |     const table = page.locator('table, [role="table"]').first();
  71  |     await expect(table).toBeVisible();
  72  | 
  73  |     const headers = await page.locator('table thead th').allInnerTexts();
  74  |     const normalizedHeaders = headers.map((header) => header.replace(/\s+/g, ' ').trim().toLowerCase());
  75  | 
  76  |     for (const expectedColumn of EXPECTED_COLUMNS) {
  77  |       expect(normalizedHeaders).toContain(expectedColumn.toLowerCase());
  78  |       await expect(
  79  |         page
  80  |           .getByRole('columnheader', {
  81  |             name: new RegExp(`^${expectedColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  82  |           })
  83  |           .first(),
  84  |       ).toBeVisible();
  85  |     }
  86  |   });
  87  | 
  88  |   test('header and KPI tiles: study attributes and KPI values are visible', async () => {
  89  |     await openFirstStudyDetailFromStudiesList();
  90  | 
  91  |     await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  92  | 
  93  |     const headerBadges = ['Ph I', 'Ph II', 'Recruiting', 'High Priority', 'Off Track', 'On Track', 'At Risk'];
  94  |     const anyBadgeVisible =
  95  |       (await Promise.all(
  96  |         headerBadges.map((label) => page.getByText(new RegExp(`^${label}$`, 'i')).first().isVisible().catch(() => false)),
  97  |       )).some(Boolean);
  98  |     expect(anyBadgeVisible).toBeTruthy();
  99  | 
  100 |     const metadataLabels = [
  101 |       'Asset',
  102 |       'Asset Lead',
  103 |       'FSO Model',
  104 |       'Study Sponsor',
  105 |       'Designation',
  106 |       'Target Enrollment',
  107 |       'Planned FPI',
  108 |       'Actual FPI',
  109 |       'Planned LPI',
  110 |       'Forecast LPI',
  111 |     ];
  112 | 
  113 |     for (const label of metadataLabels) {
  114 |       const metaLabel = page.getByText(new RegExp(`^${label}$`, 'i')).first();
  115 |       if ((await metaLabel.count()) > 0) {
  116 |         await expect(metaLabel).toBeVisible();
  117 |       }
  118 |     }
  119 | 
  120 |     const kpiTiles = [
  121 |       'Enrollment vs Plan',
  122 |       'Enrollment Rate',
  123 |       'Screen Failure Rate',
  124 |       'Dropout Rate',
  125 |       'Sites Activated',
  126 |       'Countries Activated',
  127 |     ];
  128 | 
  129 |     for (const tile of kpiTiles) {
  130 |       await expect(page.getByText(new RegExp(`^${tile}$`, 'i')).first()).toBeVisible();
  131 |     }
  132 | 
  133 |     const numericSignals = page.locator('text=/\d+(?:[\d,./]|\.\d|%|pts\/wk)+/i');
  134 |     await expect(numericSignals.first()).toBeVisible();
  135 |   });
  136 | 
  137 |   test('charts and time filters: chart sections render and filters are clickable', async () => {
  138 |     await openFirstStudyDetailFromStudiesList();
  139 | 
  140 |     await expect(page.getByRole('heading', { name: /CUMULATIVE ENROLLMENT/i })).toBeVisible();
  141 |     await expect(page.getByRole('heading', { name: /ENROLLMENT RATE/i })).toBeVisible();
  142 | 
  143 |     const chartImages = page.locator('img').filter({ has: page.locator('..') });
> 144 |     await expect(chartImages.first()).toBeVisible();
      |                                       ^ Error: expect(locator).toBeVisible() failed
  145 | 
  146 |     const timeFilters = ['Full Study', 'Since FPI', 'Last 3 Months'];
  147 |     for (const filterName of timeFilters) {
  148 |       const filter = page.getByRole('button', { name: filterName }).first();
  149 |       if ((await filter.count()) > 0) {
  150 |         await filter.click({ force: true });
  151 |         await expect(filter).toBeVisible();
  152 |       }
  153 |     }
  154 | 
  155 |     await expect(page.getByRole('heading', { name: /CUMULATIVE ENROLLMENT/i })).toBeVisible();
  156 |   });
  157 | 
  158 |   test('tables and toggles: by country/by site views switch and render', async () => {
  159 |     await openFirstStudyDetailFromStudiesList();
  160 | 
  161 |     const byCountry = page.getByRole('button', { name: 'By Country' }).first();
  162 |     const bySite = page.getByRole('button', { name: 'By Site' }).first();
  163 |     const table = page.locator('table').last();
  164 | 
  165 |     if ((await byCountry.count()) > 0) {
  166 |       await byCountry.click({ force: true });
  167 |       await expect(page.getByRole('heading', { name: /Country Breakdown/i })).toBeVisible();
  168 |       await expect(table).toBeVisible();
  169 |     }
  170 | 
  171 |     if ((await bySite.count()) > 0) {
  172 |       await bySite.click({ force: true });
  173 |       await expect(page.getByRole('heading', { name: /Site Breakdown/i })).toBeVisible();
  174 |       await expect(table).toBeVisible();
  175 |     }
  176 |   });
  177 | 
  178 |   test('row interactions and details: clicking country/site row expands details', async () => {
  179 |     await openFirstStudyDetailFromStudiesList();
  180 | 
  181 |     const bySite = page.getByRole('button', { name: 'By Site' }).first();
  182 |     if ((await bySite.count()) > 0) {
  183 |       await bySite.click({ force: true });
  184 |     }
  185 | 
  186 |     const dataRow = page.locator('table tbody tr').first();
  187 |     await expect(dataRow).toBeVisible();
  188 |     await dataRow.click({ force: true });
  189 | 
  190 |     const detailsHints = page.getByText(/Site Info|Screening Funnel|Monthly Enrollment|Country|PI/i).first();
  191 |     await expect(detailsHints).toBeVisible();
  192 |   });
  193 | 
  194 |   test('popovers/details and error handling: optional overlays and error states are handled safely', async () => {
  195 |     await openFirstStudyDetailFromStudiesList();
  196 | 
  197 |     const actionButtons = ['Underperforming', 'Overperforming', 'Milestones'];
  198 |     let clickedOptionalAction = false;
  199 | 
  200 |     for (const name of actionButtons) {
  201 |       const actionButton = page.getByRole('button', { name }).first();
  202 |       if ((await actionButton.count()) > 0) {
  203 |         await actionButton.click({ force: true });
  204 |         clickedOptionalAction = true;
  205 |         break;
  206 |       }
  207 |     }
  208 | 
  209 |     if (clickedOptionalAction) {
  210 |       const optionalDialog = page.getByRole('dialog').first();
  211 |       if ((await optionalDialog.count()) > 0) {
  212 |         await expect(optionalDialog).toBeVisible();
  213 |       } else {
  214 |         await expect(page.locator('body')).toBeVisible();
  215 |       }
  216 |     }
  217 | 
  218 |     const errorIndicators = page.getByText(/error|failed|unable to load|something went wrong/i).first();
  219 |     if ((await errorIndicators.count()) > 0) {
  220 |       await expect(errorIndicators).toBeVisible();
  221 |     } else {
  222 |       await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  223 |     }
  224 | 
  225 |     expect(true).toBeTruthy();
  226 |   });
  227 | });
```