import { test, expect, APIResponse } from '@playwright/test';

const STUDIES_PATH = '/api/study-protocol/studies';

const REQUIRED_STUDY_KEYS = [
  'id',
  'phase',
  'therapeuticArea',
  'indication',
  'title',
  'portfolio',
  'program',
  'status',
  'priority',
  'target',
  'actual',
  'percentVsPlan',
  'countries',
  'sites',
  'performance',
  'trend',
] as const;

async function parseJsonBody(response: APIResponse) {
  const contentType = response.headers()['content-type'] || '';
  const text = await response.text();

  expect(contentType.toLowerCase()).toContain('application/json');

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON response but received: ${text.slice(0, 250)}`);
  }
}

async function assertStudiesSuccess(response: APIResponse, expectedPage: number, expectedLimit: number) {
  expect(response.status()).toBe(200);

  const body = await parseJsonBody(response);
  expect(typeof body).toBe('object');
  expect(body).not.toBeNull();

  expect(body).toEqual(
    expect.objectContaining({
      items: expect.any(Array),
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
      hasMore: expect.any(Boolean),
    })
  );

  expect(body.page).toBe(expectedPage);
  expect(body.limit).toBe(expectedLimit);
  expect(body.total).toBeGreaterThanOrEqual(0);

  if (body.items.length > 0) {
    const first = body.items[0];
    for (const key of REQUIRED_STUDY_KEYS) {
      expect(first).toHaveProperty(key);
    }

    expect(Array.isArray(first.trend)).toBeTruthy();
    expect(first.trend).toHaveLength(6);
    for (const point of first.trend) {
      expect(typeof point).toBe('number');
    }
  }

  return body;
}

function buildQuery(params: Record<string, string | number | Array<string>>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        searchParams.append(key, entry);
      }
      continue;
    }

    searchParams.set(key, String(value));
  }

  return `${STUDIES_PATH}?${searchParams.toString()}`;
}

test.describe('Studies API happy paths', () => {
  test('@smoke scenario 1: studies happy path (required params)', async ({ request }) => {
    const response = await request.get(buildQuery({ page: 1, limit: 10 }));
    await assertStudiesSuccess(response, 1, 10);
  });

  test('scenario 2: studies pagination page 2', async ({ request }) => {
    const response = await request.get(buildQuery({ page: 2, limit: 10 }));
    await assertStudiesSuccess(response, 2, 10);
  });

  test('scenario 3: studies search filter', async ({ request }) => {
    const response = await request.get(buildQuery({ page: 1, limit: 10, search: 'oncology' }));
    await assertStudiesSuccess(response, 1, 10);
  });

  test('scenario 4: studies therapeutic area single', async ({ request }) => {
    const response = await request.get(buildQuery({ page: 1, limit: 10, therapeuticArea: 'Oncology' }));
    const body = await assertStudiesSuccess(response, 1, 10);

    for (const row of body.items) {
      if (typeof row.therapeuticArea === 'string') {
        expect(row.therapeuticArea.toLowerCase()).toContain('oncology');
      }
    }
  });

  test('scenario 5: studies therapeutic area multi-select', async ({ request }) => {
    const response = await request.get(
      buildQuery({ page: 1, limit: 10, therapeuticArea: ['Oncology', 'Cardiology'] })
    );
    const body = await assertStudiesSuccess(response, 1, 10);

    const accepted = new Set(['Oncology', 'Cardiology']);
    for (const row of body.items) {
      if (typeof row.therapeuticArea === 'string') {
        const tokens = row.therapeuticArea
          .split(',')
          .map((v: string) => v.trim())
          .filter(Boolean);
        expect(tokens.some((token: string) => accepted.has(token))).toBeTruthy();
      }
    }
  });

  test('scenario 6: studies valid phase filter', async ({ request }) => {
    const response = await request.get(buildQuery({ page: 1, limit: 10, phase: 'Ph II' }));
    const body = await assertStudiesSuccess(response, 1, 10);

    for (const row of body.items) {
      if (typeof row.phase === 'string') {
        expect(row.phase).toBe('Ph II');
      }
    }
  });

  test('scenario 7: studies valid status filter', async ({ request }) => {
    const response = await request.get(buildQuery({ page: 1, limit: 10, status: 'Recruiting' }));
    const body = await assertStudiesSuccess(response, 1, 10);

    for (const row of body.items) {
      if (typeof row.status === 'string') {
        expect(row.status).toBe('Recruiting');
      }
    }
  });

  test('scenario 8: studies combined filters', async ({ request }) => {
    const response = await request.get(
      buildQuery({ page: 1, limit: 10, phase: 'Ph III', status: 'Planned', region: 'US' })
    );
    const body = await assertStudiesSuccess(response, 1, 10);

    for (const row of body.items) {
      if (typeof row.phase === 'string') {
        expect(row.phase).toBe('Ph III');
      }
      if (typeof row.status === 'string') {
        expect(row.status).toBe('Planned');
      }
      if (typeof row.region === 'string') {
        expect(row.region).toBe('US');
      }
    }
  });

  test('scenario 9: studies valid sorting', async ({ request }) => {
    const response = await request.get(
      buildQuery({ page: 1, limit: 10, sortBy: 'sites', sortOrder: 'desc' })
    );
    const body = await assertStudiesSuccess(response, 1, 10);

    const siteValues = body.items
      .map((row: Record<string, unknown>) => row.sites)
      .filter((v: unknown) => typeof v === 'number') as number[];

    for (let i = 1; i < siteValues.length; i += 1) {
      expect(siteValues[i - 1]).toBeGreaterThanOrEqual(siteValues[i]);
    }
  });
});
