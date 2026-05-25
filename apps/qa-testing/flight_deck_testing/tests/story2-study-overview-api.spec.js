const { test, expect } = require('../utils/stepTest');

const STUDIES_PATH = '/api/study-protocol/studies';
const KPI_PATH = '/api/study-protocol/kpi-details';

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

async function getStudies(pageRequest, expectedPage, expectedLimit) {
  expect(pageRequest.status()).toBe(200);
  const body = await parseJsonBody(pageRequest);

  expect(body).toEqual(
    expect.objectContaining({
      items: expect.any(Array),
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
      hasMore: expect.any(Boolean),
    }),
  );

  expect(body.page).toBe(expectedPage);
  expect(body.limit).toBe(expectedLimit);
  expect(body.total).toBeGreaterThanOrEqual(0);

  return body;
}

test.describe('Story 2 - Study Overview API', () => {
  test('@story2-api studies list returns data shape needed for overview table', async ({ request }) => {
    const response = await request.get(`${STUDIES_PATH}?page=1&limit=20`);
    const body = await getStudies(response, 1, 20);

    if (body.items.length > 0) {
      const first = body.items[0];
      const story2RequiredKeys = [
        'id',
        'title',
        'phase',
        'status',
        'target',
        'actual',
        'percentVsPlan',
        'countries',
        'sites',
        'performance',
        'trend',
      ];

      for (const key of story2RequiredKeys) {
        expect(first).toHaveProperty(key);
      }

      expect(Array.isArray(first.trend)).toBeTruthy();
    }
  });

  test('@story2-api studies endpoint supports Story 2 table search and sort behavior', async ({ request }) => {
    const response = await request.get(
      `${STUDIES_PATH}?page=1&limit=20&search=ST-2024&sortBy=sites&sortOrder=desc`,
    );
    const body = await getStudies(response, 1, 20);

    const siteValues = body.items
      .map((item) => item.sites)
      .filter((value) => typeof value === 'number');

    for (let i = 1; i < siteValues.length; i += 1) {
      expect(siteValues[i - 1]).toBeGreaterThanOrEqual(siteValues[i]);
    }
  });

  test('@story2-api studies endpoint supports Story 2 filter behavior', async ({ request }) => {
    const response = await request.get(
      `${STUDIES_PATH}?page=1&limit=20&phase=Ph%20II&status=Recruiting&therapeuticArea=Oncology`,
    );
    const body = await getStudies(response, 1, 20);

    for (const row of body.items) {
      if (typeof row.phase === 'string') {
        expect(row.phase).toBe('Ph II');
      }
      if (typeof row.status === 'string') {
        expect(row.status).toBe('Recruiting');
      }
      if (typeof row.therapeuticArea === 'string') {
        expect(row.therapeuticArea.toLowerCase()).toContain('oncology');
      }
    }
  });

  test('@story2-api KPI details endpoint provides metric cards for overview', async ({ request }) => {
    const response = await request.get(KPI_PATH);
    expect(response.status()).toBe(200);

    const body = await parseJsonBody(response);
    expect(body).toEqual(
      expect.objectContaining({
        active_studies: expect.any(Object),
        on_track: expect.any(Object),
        off_track_or_at_risk: expect.any(Object),
        enrollment_vs_target: expect.any(Object),
        velocity_vs_plan: expect.any(Object),
      }),
    );

    expect(typeof body.active_studies.count).toBe('number');
    expect(typeof body.on_track.percentage).toBe('number');
    expect(typeof body.off_track_or_at_risk.percentage).toBe('number');
    expect(typeof body.enrollment_vs_target.percentage).toBe('number');
    expect(typeof body.velocity_vs_plan.average).toBe('number');
  });

  test('@story2-api validation: invalid query input returns safe API response', async ({ request }) => {
    const response = await request.get(`${STUDIES_PATH}?page=0&limit=abc`);
    expect([400, 422]).toContain(response.status());

    const body = await parseJsonBody(response);
    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
  });
});
