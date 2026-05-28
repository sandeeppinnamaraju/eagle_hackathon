# PowerShell script to run all API tests against the ngrok endpoint
$env:TEST_BASE_URL="https://willfully-grumble-likely.ngrok-free.dev"
npx playwright test tests/kpi-details.spec.js --headed --project=chromium
npx playwright test tests/studies-validation.spec.js --headed --project=chromium
npx playwright test tests/studies-happy.spec.js --headed --project=chromium
npx playwright test tests/study-overview-api.spec.js --headed --project=chromium
