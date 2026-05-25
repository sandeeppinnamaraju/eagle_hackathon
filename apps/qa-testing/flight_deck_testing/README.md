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

## Setup Instructions

```sh
git clone <repo-url>
cd <project-folder>
npm install
npx playwright install
```

## How to Run Tests

Run all tests:
```sh
npx playwright test
```

Run dashboard tests:
```sh
npx playwright test tests/dashboard.spec.js --headed --project=chromium --workers=1
```

Run protocol search tests:
```sh
npx playwright test tests/protocal-search.spec.js --headed --project=chromium --workers=1
```

Run Story 2 (Study Overview) tests:
```sh
npx playwright test tests/story2-study-overview.spec.js --project=chromium --workers=1
```

Debug mode:
```sh
npx playwright test --debug
```

## Current Test Coverage

- Dashboard testing (Story 1)
	Validates core dashboard behavior such as page load, table/card visibility, required columns, search behavior, basic filter interaction, sorting interaction, and empty-state handling.

- Story 2 Study Overview flow
	Covers a smooth end-to-end journey from dashboard to study detail and validates: navigation, studies list/table load, required columns, study header attributes, KPI tiles, chart section presence, time-filter interactions, country/site toggle behavior, row expansion details, optional popovers, and safe error-state handling.

- Protocol similarity search (Story 3)
	Validates protocol-search stability for input and search execution, result/empty-state rendering, and safe navigation to details where available.

- KPI and study-related validations (API)
	Covers backend contract checks for study and KPI endpoints, including happy-path responses, schema/shape validation, pagination/filter/sort behavior, and negative/validation scenarios (invalid parameters and method-not-allowed checks).

## Notes

- Run with `--workers=1` for stability
- Use `--headed` for debugging
- Avoid parallel execution during development

## Future Work

- Additional test cases will be added
- Coverage will be expanded
- Enhancements planned
