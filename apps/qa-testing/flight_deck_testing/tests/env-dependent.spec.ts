import { test, expect } from '@playwright/test';

const RUN_ENV_DEPENDENT = process.env.RUN_ENV_DEPENDENT === 'true';
const KPI_PATH = '/api/study-protocol/kpi-details';

test.describe('Environment dependent API checks', () => {
  test.skip(!RUN_ENV_DEPENDENT, 'Set RUN_ENV_DEPENDENT=true to run env-dependent scenarios.');

  test('@manual scenario 19: KPI empty data edge case', async ({ request }) => {
    const response = await request.get(KPI_PATH);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.active_studies.count).toBe(0);
    expect(body.on_track.percentage).toBe(0);
    expect(body.off_track_or_at_risk.percentage).toBe(0);
    expect(body.enrollment_vs_target.percentage).toBe(0);

    if (typeof body.velocity_vs_plan.average === 'number') {
      expect(body.velocity_vs_plan.average).toBeGreaterThanOrEqual(0);
    }
  });

  test('@manual scenario 20: KPI DB outage behavior', async ({ request }) => {
    const response = await request.get(KPI_PATH);
    expect(response.status()).toBe(500);

    const body = await response.json();
    expect(body).toEqual(
      expect.objectContaining({
        detail: expect.any(String),
      })
    );
    expect(body.detail.trim().length).toBeGreaterThan(0);
  });
});
