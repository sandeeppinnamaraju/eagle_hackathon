const { test, expect } = require('../utils/stepTest');

const KPI_PATH_WITH_PAGINATION =
  'https://willfully-grumble-likely.ngrok-free.dev/api/v1/study-overview/breakdown/countries?studyId=ST-2024-002&timeHorizon=Full%20Study';

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

async function assertKpiSuccess(response) {
  expect(response.status()).toBe(200);

  const body = await parseJsonBody(response);
  expect(body).toEqual(
    expect.objectContaining({
      countries: expect.any(Array),
    })
  );

  expect(body.countries.length).toBeGreaterThan(0);

  for (const country of body.countries) {
    expect(country).toEqual(
      expect.objectContaining({
        country: expect.any(String),
        actual: expect.any(Number),
        target: expect.any(Number),
        avgRate: expect.any(Number),
        percentEnrolled: expect.any(Number),
        sitesActive: expect.any(Number),
        status: expect.any(String),
        sites: expect.any(Array),
      })
    );

    expect(country.actual).toBeGreaterThanOrEqual(0);
    expect(country.target).toBeGreaterThanOrEqual(0);
    expect(country.percentEnrolled).toBeGreaterThanOrEqual(0);
    expect(country.sitesActive).toBeGreaterThanOrEqual(0);

    for (const site of country.sites) {
      expect(site).toEqual(
        expect.objectContaining({
          siteId: expect.any(String),
          siteName: expect.any(String),
          status: expect.any(String),
          actual: expect.any(Number),
          target: expect.any(Number),
          percentEnrolled: expect.any(Number),
        })
      );

      expect(site.actual).toBeGreaterThanOrEqual(0);
      expect(site.target).toBeGreaterThanOrEqual(0);
      expect(site.percentEnrolled).toBeGreaterThanOrEqual(0);
    }
  }

  return body;
}

test.describe('KPI details API', () => {
  test('@smoke scenario 17: KPI details happy path', async ({ request }) => {
    const response = await request.get(KPI_PATH_WITH_PAGINATION);
    await assertKpiSuccess(response);
  });

  test('scenario 18: KPI numeric shape checks', async ({ request }) => {
    const response = await request.get(KPI_PATH_WITH_PAGINATION);
    const body = await assertKpiSuccess(response);

    const totalActual = body.countries.reduce((sum, country) => sum + country.actual, 0);
    const totalTarget = body.countries.reduce((sum, country) => sum + country.target, 0);

    expect(totalActual).toBeGreaterThanOrEqual(0);
    expect(totalTarget).toBeGreaterThanOrEqual(0);
  });

  test('scenario 21: KPI method not allowed', async ({ request }) => {
    const response = await request.post(KPI_PATH_WITH_PAGINATION, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {},
    });

    expect(response.status()).toBe(405);
  });
});
