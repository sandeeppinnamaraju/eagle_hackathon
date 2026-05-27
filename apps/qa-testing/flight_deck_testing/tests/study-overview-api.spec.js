const { test, expect } = require('../utils/stepTest');

const BASE = 'https://willfully-grumble-likely.ngrok-free.dev/api/v1/study-overview';

const ENDPOINTS = {
  kpi: `${BASE}/kpi-details`,
  summary: `${BASE}/summary`,
  chartCumulative: `${BASE}/charts/enrollment-cumulative`,
  chartRate: `${BASE}/charts/enrollment-rate`,
  breakdownCountries: `${BASE}/breakdown/countries`,
};

async function parseJsonBody(response) {
  const contentType = response.headers()['content-type'] || '';
  const text = await response.text();
  expect(contentType.toLowerCase()).toContain('application/json');
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON response but received: ${text.slice(0, 250)}`);
  }
}

test.describe('Study Overview API coverage', () => {
  // 1. KPI DETAILS
    test('GET /api/v1/study-overview/summary - happy path & field validation', async ({ request }) => {
      const params = '?studyId=ST-2024-002&timeHorizon=Full%20Study';
      const response = await request.get(ENDPOINTS.summary + params);
      expect(response.status()).toBe(200);
      const body = await parseJsonBody(response);
      expect(body).toHaveProperty('studyId');
      expect(body).toHaveProperty('studyStatus');
      expect(body).toHaveProperty('performanceStatus');
      expect(body).toHaveProperty('targetEnrollment');
      expect(body).toHaveProperty('milestones');
    });


  // Additional/edge/error scenarios for all endpoints
  for (const [name, url] of Object.entries(ENDPOINTS)) {
    test(`GET ${url} - invalid studyId`, async ({ request }) => {
      const response = await request.get(`${url}?studyId=INVALID_ID`);
      expect([400, 404, 422]).toContain(response.status());
      const body = await parseJsonBody(response);
      expect(typeof body).toBe('object');
    });
    test(`GET ${url} - missing studyId`, async ({ request }) => {
      const response = await request.get(url);
      expect([200, 400, 404, 422]).toContain(response.status());
      const body = await parseJsonBody(response);
      expect(typeof body).toBe('object');
    });
    test(`GET ${url} - response time < 2s`, async ({ request }) => {
      const start = Date.now();
      const response = await request.get(url);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(2000);
    });
  }
});
