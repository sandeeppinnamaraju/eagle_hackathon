# Flight Deck Automation Testing – Playwright

## Project Description

This repository contains Playwright-based automation scripts for the Flight Deck application. The purpose is to automate UI and API validation for dashboard features, protocol similarity search, KPI, and study-related workflows.  
**Project is currently under development.**  
Test coverage and scripts are actively evolving; more test cases may be added and existing scripts may change.

## Tech Stack

- Playwright
- JavaScript / TypeScript
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

Debug mode:
```sh
npx playwright test --debug
```

## Current Test Coverage

- Dashboard testing
- Protocol similarity search
- KPI and study-related validations

## Notes

- Run with `--workers=1` for stability
- Use `--headed` for debugging
- Avoid parallel execution during development

## Future Work

- Additional test cases will be added
- Coverage will be expanded
- Enhancements planned
