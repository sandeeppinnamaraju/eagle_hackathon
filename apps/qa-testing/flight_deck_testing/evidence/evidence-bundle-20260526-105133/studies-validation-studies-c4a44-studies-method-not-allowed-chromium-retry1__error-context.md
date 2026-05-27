# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: studies-validation.spec.js >> Studies API validations and hardening >> @validation scenario 16: studies method not allowed
- Location: tests\studies-validation.spec.js:83:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 405
Received: 500
```

# Test source

```ts
  1  | const { test, expect } = require('../utils/stepTest');
  2  | 
  3  | const STUDIES_PATH = '/api/study-protocol/studies';
  4  | 
  5  | async function parseJsonBody(response) {
  6  |   const contentType = response.headers()['content-type'] || '';
  7  |   const text = await response.text();
  8  | 
  9  |   expect(contentType.toLowerCase()).toContain('application/json');
  10 | 
  11 |   try {
  12 |     return JSON.parse(text);
  13 |   } catch {
  14 |     throw new Error(`Expected JSON response but received: ${text.slice(0, 250)}`);
  15 |   }
  16 | }
  17 | 
  18 | async function assertStudiesValidationError(response) {
  19 |   expect(response.status()).toBe(400);
  20 |   const body = await parseJsonBody(response);
  21 |   expect(body).toEqual(
  22 |     expect.objectContaining({
  23 |       message: 'Invalid query parameter',
  24 |     })
  25 |   );
  26 | }
  27 | 
  28 | function buildQuery(params) {
  29 |   const searchParams = new URLSearchParams();
  30 |   for (const [key, value] of Object.entries(params)) {
  31 |     searchParams.set(key, String(value));
  32 |   }
  33 |   return `${STUDIES_PATH}?${searchParams.toString()}`;
  34 | }
  35 | 
  36 | test.describe('Studies API validations and hardening', () => {
  37 |   test('@validation scenario 10: studies invalid page', async ({ request }) => {
  38 |     const response = await request.get(buildQuery({ page: 0, limit: 10 }));
  39 |     await assertStudiesValidationError(response);
  40 |   });
  41 | 
  42 |   test('@validation scenario 11: studies invalid limit format', async ({ request }) => {
  43 |     const response = await request.get(`${STUDIES_PATH}?page=1&limit=abc`);
  44 |     await assertStudiesValidationError(response);
  45 |   });
  46 | 
  47 |   test('@validation scenario 12: studies invalid phase', async ({ request }) => {
  48 |     const response = await request.get(buildQuery({ page: 1, limit: 10, phase: 'Phase 5' }));
  49 |     await assertStudiesValidationError(response);
  50 |   });
  51 | 
  52 |   test('@validation scenario 13: studies invalid status', async ({ request }) => {
  53 |     const response = await request.get(buildQuery({ page: 1, limit: 10, status: 'Closed' }));
  54 |     await assertStudiesValidationError(response);
  55 |   });
  56 | 
  57 |   test('@validation scenario 14: studies invalid sortBy (injection attempt)', async ({ request }) => {
  58 |     const response = await request.get(
  59 |       buildQuery({
  60 |         page: 1,
  61 |         limit: 10,
  62 |         sortBy: 'id;DROP TABLE public.studies',
  63 |         sortOrder: 'asc',
  64 |       })
  65 |     );
  66 |     await assertStudiesValidationError(response);
  67 |   });
  68 | 
  69 |   test('@validation scenario 15: studies search injection-like payload', async ({ request }) => {
  70 |     const response = await request.get(buildQuery({ page: 1, limit: 10, search: "' OR 1=1 --" }));
  71 |     expect([200, 400]).toContain(response.status());
  72 | 
  73 |     const body = await parseJsonBody(response);
  74 |     expect(typeof body).toBe('object');
  75 |     expect(body).not.toBeNull();
  76 | 
  77 |     const serialized = JSON.stringify(body).toLowerCase();
  78 |     expect(serialized).not.toContain('exception');
  79 |     expect(serialized).not.toContain('stack trace');
  80 |     expect(serialized).not.toContain('sqlstate');
  81 |   });
  82 | 
  83 |   test('@validation scenario 16: studies method not allowed', async ({ request }) => {
  84 |     const response = await request.post(`${STUDIES_PATH}?page=1&limit=10`, {
  85 |       headers: {
  86 |         'Content-Type': 'application/json',
  87 |       },
  88 |       data: {},
  89 |     });
  90 | 
> 91 |     expect(response.status()).toBe(405);
     |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  92 |   });
  93 | });
  94 | 
```