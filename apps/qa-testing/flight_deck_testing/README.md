# Flight Deck Automation Testing – Playwright

## Project Description

This repository contains Playwright-based automation scripts for the Flight Deck application. The purpose is to automate UI and API validation for dashboard features, protocol similarity search, KPI, and study-related workflows.  
**Project is currently under development.**  
Test coverage and scripts are actively evolving; more test cases may be added and existing scripts may change.

## Tech Stack

- Playwright
- JavaScript
- Node.js

## Project Structure

- `tests/` → Automation test files  
- `pages/` → Page objects for UI abstraction  
- `fixtures/` → Reusable test data  
- `utils/` → Helper utilities and shared functions  
- `evidence/` → Test run evidence, HTML/JSON reports, zipped bundles  

## Setup Instructions

```sh
git clone <repo-url>
cd <project-folder>
npm install
npx playwright install
```

## How to Run Tests

### Run All Tests

```sh
npx playwright test
```

### Run Individual UI Tests

Dashboard:
```sh
npx playwright test tests/dashboard.spec.js --headed --project=chromium --workers=1
```

Protocol Search:
```sh
npx playwright test tests/protocal-search.spec.js --headed --project=chromium --workers=1
```

Story 2 (Study Overview):
```sh
npx playwright test tests/story2-study-overview.spec.js --headed --project=chromium --workers=1
```

### Run API Tests (with PowerShell script)

```sh
./run-api-tests-ngrok.ps1
```

### Debug Mode

```sh
npx playwright test --debug
```


**API Tests:**
- The PowerShell script `run-api-tests-ngrok.ps1` sets the `TEST_BASE_URL` environment variable. Edit the script to update the URL.

**Global Playwright Config:**
- The Playwright config (`playwright.config.js`) uses `process.env.TEST_BASE_URL` for `baseURL` if set. You can also run tests with:
  ```sh
  TEST_BASE_URL=https://your-backend-url npx playwright test
  ```

## Current Test Coverage

- Dashboard testing (Story 1)
	Validates core dashboard behavior such as page load, table/card visibility, columns, search, filters, sorting, empty-state.

- Story 2 Study Overview flow
	Covers a smooth end-to-end journey from dashboard to study detail and validates: navigation, studies list/table load, required columns, study header attributes, KPI tiles, chart section presence, time-filter interactions, country/site toggle behavior, row expansion details, optional popovers, and safe error-state handling.

- Protocol similarity search (Story 3)
	Validates protocol-search stability for input and search execution, result/empty-state rendering, and safe navigation to details where available.

- KPI and study-related validations (API)
	Covers backend contract checks for study and KPI endpoints, including happy-path responses, schema/shape validation, pagination/filter/sort behavior, and negative/validation scenarios (invalid parameters and method-not-allowed checks).

## Evidence & Reporting

- After each run, evidence (screenshots, traces, JSON, HTML report) is saved in the `evidence/` folder.
- To view the latest HTML report:
  ```sh
  npx playwright show-report
  ```
- Evidence bundles and summaries are auto-generated for each run.

## Notes

- Run with `--workers=1` for stability
- Use `--headed` for debugging
- Avoid parallel execution during development

## Future Work

- Additional test cases will be added
- Coverage will be expanded
- Enhancements planned

### UI Test Files
- `tests/dashboard.spec.js` – Dashboard (Story 1): page load, table/card visibility, columns, search, filters, sorting, empty-state
- `tests/protocal-search.spec.js` – Protocol Similarity Search (Story 3): input/search, result/empty-state, navigation
- `tests/story2-study-overview.spec.js` – Story 2: dashboard to study detail, navigation, table, header, KPIs, charts, toggles, error handling

### API Test Files
- `tests/kpi-details.spec.js` – KPI endpoint contract, schema, values
- `tests/studies-validation.spec.js` – Study endpoint validation, error/negative scenarios
- `tests/studies-happy.spec.js` – Study endpoint happy path, schema, pagination, sorting
 - `tests/study-overview-api.spec.js` – Study Overview API: summary endpoint happy path, invalid/missing studyId, response time checks



