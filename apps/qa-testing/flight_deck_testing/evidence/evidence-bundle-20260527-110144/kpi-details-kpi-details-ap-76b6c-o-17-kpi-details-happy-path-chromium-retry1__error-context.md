# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kpi-details.spec.js >> KPI details API >> @smoke scenario 17: KPI details happy path
- Location: tests\kpi-details.spec.js:49:3

# Error details

```
TypeError: apiRequestContext.get: Invalid URL
```

# Test source

```ts
  1  | const { test, expect } = require('../utils/stepTest');
  2  | 
  3  | const KPI_PATH = '/api/study-protocol/kpi-details';
  4  | const KPI_PATH_WITH_PAGINATION = `${KPI_PATH}?page=1&limit=20`;
  5  | 
  6  | async function parseJsonBody(response) {
  7  |   const contentType = response.headers()['content-type'] || '';
  8  |   const text = await response.text();
  9  | 
  10 |   expect(contentType.toLowerCase()).toContain('application/json');
  11 | 
  12 |   try {
  13 |     return JSON.parse(text);
  14 |   } catch {
  15 |     throw new Error(`Expected JSON response but received: ${text.slice(0, 250)}`);
  16 |   }
  17 | }
  18 | 
  19 | async function assertKpiSuccess(response) {
  20 |   expect(response.status()).toBe(200);
  21 | 
  22 |   const body = await parseJsonBody(response);
  23 |   expect(body).toEqual(
  24 |     expect.objectContaining({
  25 |       active_studies: expect.any(Object),
  26 |       on_track: expect.any(Object),
  27 |       off_track_or_at_risk: expect.any(Object),
  28 |       enrollment_vs_target: expect.any(Object),
  29 |       velocity_vs_plan: expect.any(Object),
  30 |     })
  31 |   );
  32 | 
  33 |   expect(typeof body.active_studies.count).toBe('number');
  34 |   expect(body.active_studies.count).toBeGreaterThanOrEqual(0);
  35 | 
  36 |   expect(typeof body.on_track.percentage).toBe('number');
  37 |   expect(typeof body.off_track_or_at_risk.percentage).toBe('number');
  38 |   expect(typeof body.enrollment_vs_target.percentage).toBe('number');
  39 |   expect(typeof body.velocity_vs_plan.average).toBe('number');
  40 | 
  41 |   expect(body.on_track.percentage).toBeGreaterThanOrEqual(0);
  42 |   expect(body.off_track_or_at_risk.percentage).toBeGreaterThanOrEqual(0);
  43 |   expect(body.enrollment_vs_target.percentage).toBeGreaterThanOrEqual(0);
  44 | 
  45 |   return body;
  46 | }
  47 | 
  48 | test.describe('KPI details API', () => {
  49 |   test('@smoke scenario 17: KPI details happy path', async ({ request }) => {
> 50 |     const response = await request.get(KPI_PATH_WITH_PAGINATION);
     |                                    ^ TypeError: apiRequestContext.get: Invalid URL
  51 |     await assertKpiSuccess(response);
  52 |   });
  53 | 
  54 |   test('scenario 18: KPI numeric shape checks', async ({ request }) => {
  55 |     const response = await request.get(KPI_PATH_WITH_PAGINATION);
  56 |     const body = await assertKpiSuccess(response);
  57 | 
  58 |     const sum = body.on_track.percentage + body.off_track_or_at_risk.percentage;
  59 |     expect(sum).toBeGreaterThanOrEqual(0);
  60 |     expect(sum).toBeLessThanOrEqual(200);
  61 |   });
  62 | 
  63 |   test('scenario 21: KPI method not allowed', async ({ request }) => {
  64 |     const response = await request.post(KPI_PATH_WITH_PAGINATION, {
  65 |       headers: {
  66 |         'Content-Type': 'application/json',
  67 |       },
  68 |       data: {},
  69 |     });
  70 | 
  71 |     expect(response.status()).toBe(405);
  72 |   });
  73 | });
  74 | 
```