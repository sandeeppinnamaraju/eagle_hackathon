# Flight Deck Automation Testing - Playwright

## Project Description

This repository contains Playwright-based automation scripts for the Flight Deck application.
It validates both UI and API workflows, including login, Study Portfolio dashboard, Study Overview,
Protocol Similarity Search, and study/KPI API contracts.

## Tech Stack

- Playwright
- JavaScript
- Node.js

## Project Structure

- `tests/` -> UI and API automation specs
- `pages/` -> Page object models
- `fixtures/` -> Shared test data
- `utils/` -> Shared helpers and setup utilities
- `evidence/` -> Reports, screenshots, traces, zipped evidence bundles

## Setup

```sh
git clone <repo-url>
cd <project-folder>
npm install
npx playwright install
```

## Environment Configuration

- `playwright.config.js` reads `TEST_BASE_URL` when set.
- For API runs with ngrok URL management, use `run-api-tests-ngrok.ps1`.
- Login credentials are handled via shared auth helpers and can be overridden with env vars where applicable.

Example:

```sh
TEST_BASE_URL=https://your-environment-url npx playwright test
```

## Run Commands

### Run All Tests

```sh
npx playwright test
```

### Run All UI Tests In One Go

```sh
npx playwright test tests/login-page.spec.js tests/dashboard.spec.js tests/story2-study-overview.spec.js tests/protocal-search.spec.js --project=chromium --headed --workers=1
```

### Run All API Tests In One Go

```sh
npx playwright test tests/study-overview-api.spec.js tests/kpi-details.spec.js tests/studies-validation.spec.js tests/studies-happy.spec.js
```

### Run API Tests via PowerShell Helper

```sh
./run-api-tests-ngrok.ps1
```

### Run Individual UI Specs

```sh
npx playwright test tests/login-page.spec.js --project=chromium --headed --workers=1
npx playwright test tests/dashboard.spec.js --project=chromium --headed --workers=1
npx playwright test tests/story2-study-overview.spec.js --project=chromium --headed --workers=1
npx playwright test tests/protocal-search.spec.js --project=chromium --headed --workers=1
```

### Debug Mode

```sh
npx playwright test --debug
```

## Current Coverage

### UI Coverage

- Login page validation: shell rendering, empty submit handling, invalid/valid credential behavior
- Study Portfolio dashboard (Story 1): table and card behaviors, required columns, search, filters, sorting, KPI visibility, empty states, navigation to study details
- Study Overview (Story 2): portfolio-to-study navigation, overview widgets, KPI and chart sections, safe optional interactions
- Protocol Similarity Search (Story 3): search flow stability, result/empty states, details navigation

### API Coverage

- Study Overview API validations (summary/charts/breakdown paths, invalid and missing parameters, response-time checks)
- KPI details API contract and numeric shape checks
- Studies API happy paths (pagination, filtering, sorting)
- Studies API validation and hardening scenarios (invalid values and method checks)

## Test Files

### UI Test Files

- `tests/login-page.spec.js` - Login page and authentication flow validation
- `tests/dashboard.spec.js` - Study Portfolio dashboard (Story 1)
- `tests/story2-study-overview.spec.js` - Study Overview journey (Story 2)
- `tests/protocal-search.spec.js` - Protocol Similarity Search (Story 3)

### API Test Files

- `tests/study-overview-api.spec.js` - Study Overview API endpoint validations
- `tests/kpi-details.spec.js` - KPI details API validations
- `tests/studies-happy.spec.js` - Studies API happy path validations
- `tests/studies-validation.spec.js` - Studies API negative/validation scenarios

## Evidence and Reporting

- Test artifacts are saved under `evidence/` after each run.
- Latest outputs include:
  - `evidence/latest-evidence-summary.md`
  - `evidence/latest-playwright-report.json`
  - time-stamped evidence bundle folder and zip

Open HTML report:

```sh
npx playwright show-report
```

## Stability Recommendations

- Use `--workers=1` for deterministic execution in shared environments
- Use `--headed` while debugging UI behavior
- Prefer running smoke checks first when switching to a new deployment URL



