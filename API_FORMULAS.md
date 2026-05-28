# API Formula Inventory

This document lists computation formulas used by API routers in backend/src/routers.

## Scope

- fd_admin_config.py
- fd_auth.py
- fd_protocol_similarity.py
- fd_study_overview.py
- fd_study_protocol.py

---

## fd_auth.py

### POST /auth/login

- Bcrypt password verification:

  ```text
  is_valid = bcrypt.checkpw(plaintext_password, stored_hash)
  ```

---

## fd_protocol_similarity.py

### GET /protocols/summary

- Protocol count:

  ```text
  protocolCount = COUNT(*)
  ```

- Distinct therapeutic area count:

  ```text
  distinctTherapeuticAreaCount = COUNT(DISTINCT therapeutic_area)
  ```

---

## fd_study_overview.py

### Shared helper formulas

- Performance status by percent value:

  ```text
  if percent > 95      -> ON_TRACK
  if 80 <= percent <= 94 -> OFF_TRACK
  else                 -> AT_RISK
  ```

- Month subtraction day clamping:

  ```text
  day = min(anchor_day, days_in_target_month)
  ```

- KPI value formatting:

  ```text
  rounded_value = round(value, digits)
  ```

### GET /study-overview/breakdown/top-underperforming

- Site shortfall:

  ```text
  shortfall = total_target - total_actual
  ```

- Percent below target:

  ```text
  pct_below = (shortfall / total_target) * 100
  ```

### GET /study-overview/breakdown/top-performing

- Site surplus:

  ```text
  surplus = total_actual - total_target
  ```

- Percent above target:

  ```text
  pct_above = (surplus / total_target) * 100
  ```

### GET /study-overview/charts/enrollment-rate and /study-overview/enrollment-rate-monthly

- Monthly totals:

  ```text
  planned_total(month) = SUM(planned_rate)
  actual_total(month)  = SUM(actual_rate)
  ```

### GET /study-overview/charts/enrollment-cumulative and /study-overview/enrollment-cumulative

- Monthly point selection:

  ```text
  For each month, pick latest row by period_date
  ```

- Values selected per month:

  ```text
  planned_cumulative, actual_cumulative, forecast_cumulative
  ```

### GET /study-overview/kpi-details

- Timeline screen failure rate per point:

  ```text
  screenFailureRate = (failed_this_period / screened_this_period) * 100
  ```

- Timeline dropout rate per point:

  ```text
  dropoutRate = (dropouts_this_period / enrolled_this_period) * 100
  ```

- Enrollment vs plan using period deltas:

  ```text
  planned_this_period = planned_cumulative - LAG(planned_cumulative)
  enrollmentVsPlan% = (SUM(actual_this_period) / SUM(planned_this_period)) * 100
  ```

- Enrollment rate per week approximation:

  ```text
  weeks = row_count * 4.333
  actual_per_week = SUM(actual_rate) / weeks
  planned_per_week = SUM(planned_rate) / weeks
  rate% = (actual_per_week / planned_per_week) * 100
  ```

- Fallback enrollment rate from enrollment_timeline:

  ```text
  weeks = row_count * 4.333
  actual_per_week = SUM(enrolled_this_period) / weeks
  ```

- Aggregated screen failure rate from kpi_timeline:

  ```text
  screenFailureRate = (SUM(failed_this_period) / SUM(screened_this_period)) * 100
  ```

- Aggregated dropout rate from kpi_timeline:

  ```text
  dropoutRate = (SUM(dropouts_this_period) / SUM(enrolled_this_period)) * 100
  ```

- Snapshot-based averages:

  ```text
  screenFailureRate = AVG(screen_failure_rate)
  dropoutRate = AVG(dropout_rate)
  ```

- Site activation KPI (timeline path):

  ```text
  actualSitesActivated = MAX(sites_activated)
  plannedSitesActivated = MAX(sites_planned)
  ```

- Country activation KPI (timeline path):

  ```text
  actualCountriesActivated = MAX(countries_activated)
  plannedCountriesActivated = MAX(countries_planned)
  ```

- Site/country activation snapshot fallback uses latest-per-study rows and sums:

  ```text
  actual = SUM(latest activated per study)
  planned = SUM(latest planned per study)
  ```

---

## fd_study_protocol.py

### Shared helper formulas

- Performance status from percent value:

  ```text
  if percent > 95      -> ON_TRACK
  if 80 <= percent <= 94 -> OFF_TRACK
  else                 -> AT_RISK
  ```

- Trend generation from anchor value:

  ```text
  trend = [0.15*a, 0.30*a, 0.50*a, 0.70*a, 0.85*a, 1.00*a]
  ```

  Where:

  ```text
  a = actual_enrollment if actual_enrollment > 0 else target_enrollment
  ```

- SQL performance sort ranking:

  ```text
  CASE
    WHEN enrollment_plan_percent > 95 THEN 3
    WHEN 80 <= enrollment_plan_percent <= 94 THEN 2
    ELSE 1
  END
  ```

### GET /study-protocol/on-track

- On-track percentage:

  ```text
  on_track% = (on_track_studies_count / total_active_studies) * 100
  ```

### GET /study-protocol/off-track-or-at-risk

- Off-track or at-risk percentage:

  ```text
  off_track_or_at_risk% = (off_track_or_at_risk_count / total_active_studies) * 100
  ```

### GET /study-protocol/enrollment-vs-target

- Enrollment vs target percentage:

  ```text
  percentage = (sum_actual / sum_target) * 100
  ```

### GET /study-protocol/velocity-vs-plan

- Average velocity vs plan:

  ```text
  average_velocity_vs_plan = AVG(enrollment_plan_percent)
  ```

### GET /study-protocol/kpi-details

This endpoint repeats the same core KPI formulas used above:

- on_track% = on_track_count / active_studies_count * 100
- off_track_or_at_risk% = off_track_or_at_risk_count / active_studies_count * 100
- enrollment_vs_target% = total_actual_enrollment / total_target_enrollment * 100
- velocity_vs_plan = AVG(enrollment_plan_percent)

---

## fd_admin_config.py

- No arithmetic formulas.
- Contains validation checks and single-row update operations only.
