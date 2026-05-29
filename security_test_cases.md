# Security Test Cases 

Project: flight_deck_testing  
Date: 2026-05-28

## Scope
These test cases focus on practical security checks applicable to this QA automation project and its API/UI test assets, dependency set, and generated evidence artifacts.

## Note For Review
These cases are written as preventive quality controls to strengthen reliability and security posture across environments.

## Risk Scale
- High: likely security impact and should be fixed first
- Medium: meaningful risk; schedule in near-term sprint
- Low: hardening improvement

## Test Cases

### 1) SEC-API-001
- Title: Base URL Configuration Security Check
- OWASP: A05 Security Misconfiguration
- Risk Level: High
- Description: Validate that test execution uses controlled environment configuration for base URLs.
- Affected Component/File: run-api-tests-ngrok.ps1, tests/dashboard.spec.js, tests/studies-validation.spec.js
- Steps to Reproduce:
  1. Search for URL constants (for example ngrok/trycloudflare links).
  2. Run tests without setting environment base URL.
  3. Observe whether environment configuration is consistently applied.
- Expected Result: Tests only use environment-based URL values and fail safely if missing.
- Mitigation Recommendation: Replace hardcoded URLs with TEST_BASE_URL environment variable and store values in CI secrets.

### 2) SEC-API-002
- Title: API Authorization Control Test
- OWASP: A01 Broken Access Control
- Risk Level: High
- Description: Validate authorization behavior for protected APIs across authenticated and unauthenticated scenarios.
- Affected Component/File: tests/study-overview-api.spec.js, tests/kpi-details.spec.js, tests/studies-happy.spec.js
- Steps to Reproduce:
  1. Call protected API without Authorization header.
  2. Call with invalid/expired token.
  3. Call with low-privilege token.
- Expected Result: API returns 401 or 403 and does not return protected data.
- Mitigation Recommendation: Add explicit negative auth cases per protected endpoint.

### 3) SEC-API-003
- Title: Input Validation and Response Consistency Test
- OWASP: A03 Injection, A04 Insecure Design
- Risk Level: Medium
- Description: Confirm that invalid or malicious input is handled consistently and safely.
- Affected Component/File: tests/studies-validation.spec.js
- Steps to Reproduce:
  1. Send malformed input and SQL/XSS-like payloads.
  2. Test unsupported methods on endpoints.
  3. Review whether response handling remains deterministic for invalid inputs.
- Expected Result: Invalid requests return strict expected codes (400/422, 405) and no unsafe reflection occurs.
- Mitigation Recommendation: Tighten assertions and block ambiguous pass conditions.

### 4) SEC-DEP-001
- Title: Dependency Security Baseline Test
- OWASP: A06 Vulnerable and Outdated Components
- Risk Level: High
- Description: Validate dependency versions against known vulnerability advisories.
- Affected Component/File: package.json, package-lock.json
- Steps to Reproduce:
  1. Run npm audit.
  2. Review findings for direct dependencies.
  3. Confirm vulnerable versions are not present in lockfile.
- Expected Result: No high/critical vulnerabilities remain unaddressed.
- Mitigation Recommendation: Upgrade vulnerable packages and enforce audit checks in CI.

### 5) SEC-DATA-001
- Title: Artifact Data Protection Test
- OWASP: A02 Cryptographic Failures (Sensitive Data Exposure)
- Risk Level: Medium
- Description: Verify generated evidence files are appropriate for secure sharing.
- Affected Component/File: evidence/latest-playwright-report.json, playwright-run.json
- Steps to Reproduce:
  1. Generate test evidence artifacts.
  2. Inspect for local absolute paths and internal metadata.
  3. Confirm published evidence meets data-sharing guidelines.
- Expected Result: Shared artifacts are sanitized and do not leak sensitive local/internal details.
- Mitigation Recommendation: Add automated redaction/sanitization before sharing artifacts.

### 6) SEC-CI-001
- Title: CI Dependency Integrity Test
- OWASP: A08 Software and Data Integrity Failures
- Risk Level: Medium
- Description: Validate CI action references follow immutable and controlled versioning practices.
- Affected Component/File: .github/workflows/playwright.yml
- Steps to Reproduce:
  1. Review workflow action references.
  2. Check if references are tag-based (for example @v4) instead of commit SHA.
  3. Validate policy compliance.
- Expected Result: Third-party actions are pinned to fixed commit SHAs.
- Mitigation Recommendation: Pin all third-party actions to commit SHAs and review updates through controlled change.

## Priority Order
1. SEC-API-001
2. SEC-API-002
3. SEC-DEP-001
4. SEC-API-003
5. SEC-DATA-001
6. SEC-CI-001
