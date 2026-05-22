import { test, expect, APIResponse } from '@playwright/test';

const KPI_PATH = '/api/study-protocol/kpi-details';

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

async function assertKpiSuccess(response: APIResponse) {
  expect(response.status()).toBe(200);

  const body = await parseJsonBody(response);
  expect(body).toEqual(
    expect.objectContaining({
      active_studies: expect.any(Object),
      on_track: expect.any(Object),
      off_track_or_at_risk: expect.any(Object),
      enrollment_vs_target: expect.any(Object),
      velocity_vs_plan: expect.any(Object),
    })
  );

  expect(typeof body.active_studies.count).toBe('number');
  expect(body.active_studies.count).toBeGreaterThanOrEqual(0);

  expect(typeof body.on_track.percentage).toBe('number');
  expect(typeof body.off_track_or_at_risk.percentage).toBe('number');
  expect(typeof body.enrollment_vs_target.percentage).toBe('number');
  expect(typeof body.velocity_vs_plan.average).toBe('number');

  expect(body.on_track.percentage).toBeGreaterThanOrEqual(0);
  expect(body.off_track_or_at_risk.percentage).toBeGreaterThanOrEqual(0);
  expect(body.enrollment_vs_target.percentage).toBeGreaterThanOrEqual(0);

  return body;
}

test.describe('KPI details API', () => {
  test('@smoke scenario 17: KPI details happy path', async ({ request }) => {
    const response = await request.get(KPI_PATH);
    await assertKpiSuccess(response);
  });

  test('scenario 18: KPI numeric shape checks', async ({ request }) => {
    const response = await request.get(KPI_PATH);
    const body = await assertKpiSuccess(response);

    const sum = body.on_track.percentage + body.off_track_or_at_risk.percentage;
    expect(sum).toBeGreaterThanOrEqual(0);
    expect(sum).toBeLessThanOrEqual(200);
  });

  test('scenario 21: KPI method not allowed', async ({ request }) => {
    const response = await request.post(KPI_PATH, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {},
    });

    expect(response.status()).toBe(405);
  });
});
