# Study Overview API Integration Guide

Base URL:
`https://willfully-grumble-likely.ngrok-free.dev/api/v1`

Common headers:
- `ngrok-skip-browser-warning: 1`

Common query parameters for study-overview APIs:
- `studyId` (required)
- `timeHorizon` (optional, defaults to `Full Study`)

Allowed `timeHorizon` values:
- `Full Study`
- `Since FPI`
- `Last 3 Months`

## Error Responses

### 400
```json
{ "message": "Invalid query parameter" }
```
or
```json
{ "message": "Invalid studyId" }
```

### 500
```json
{ "message": "Internal server error" }
```

---

## KPI NA + Reason Example

Some KPI values can return `NA` with a human-readable `reason` when required data is missing for the selected study/time horizon.

Example snippet from `kpis`:
```json
{
  "enrollmentVsPlan": {
    "percentage": {
      "value": "NA",
      "reason": "Planned enrollment data is not available."
    },
    "actualEnrollments": 0.0,
    "plannedEnrollments": 0.0
  },
  "screenFailureRate": {
    "value": "NA",
    "reason": "Screen failure data is not available."
  },
  "dropoutRate": {
    "value": "NA",
    "reason": "Dropout data is not available."
  }
}
```

UI handling recommendation:
- If `value` is `"NA"`, show `NA` in the card/chart label.
- Show the `reason` as helper text or tooltip.
- Do not attempt numeric formatting when `value` is `"NA"`.

---

## 1) KPI Details

Endpoint:
- `GET /study-overview/kpi-details`

KPI blocks returned in `kpis` include:
- `enrollmentVsPlan`
- `enrollmentRate`
- `screenFailureRate`
- `dropoutRate`
- `sitesActivated` (includes `value`, `actualSitesActivated`, `plannedSitesActivated`)
- `countriesActivated` (includes `value`, `actualCountriesActivated`, `plannedCountriesActivated`)

Example:
```bash
curl -s "https://willfully-grumble-likely.ngrok-free.dev/api/v1/study-overview/kpi-details?studyId=ST-2024-002&timeHorizon=Last%203%20Months" -H "ngrok-skip-browser-warning: 1"
```

Example without timeHorizon (defaults to Full Study):
```bash
curl -s "https://willfully-grumble-likely.ngrok-free.dev/api/v1/study-overview/kpi-details?studyId=ST-2024-002" -H "ngrok-skip-browser-warning: 1"
```

Response shape:
```json
{
  "timeHorizon": "Full Study",
  "studyId": "ST-2024-002",
  "window": {
    "startDate": null,
    "endDate": "2026-05-27"
  },
  "kpis": {
    "enrollmentVsPlan": {
      "percentage": { "value": 34.15, "reason": null },
      "actualEnrollments": 56.0,
      "plannedEnrollments": 164.0
    },
    "enrollmentRate": {
      "percentage": { "value": 79.01, "reason": null },
      "actualEnrollmentRatePerWeek": 0.64,
      "plannedEnrollmentRatePerWeek": 0.81
    },
    "screenFailureRate": { "value": 24.8, "reason": null },
    "dropoutRate": { "value": 11.1, "reason": null },
    "sitesActivated": {
      "value": { "value": 19.0, "reason": null },
      "actualSitesActivated": 19,
      "plannedSitesActivated": 19
    },
    "countriesActivated": {
      "value": { "value": 5.0, "reason": null },
      "actualCountriesActivated": 5,
      "plannedCountriesActivated": 5
    }
  }
}
```

---

## 1A) Study Summary

Endpoint:
- `GET /study-overview/summary`

Purpose:
- Returns the study-level header and metadata needed for the overview page.

Required query params:
- `studyId`

Example:
```bash
curl -s "https://willfully-grumble-likely.ngrok-free.dev/api/v1/study-overview/summary?studyId=ST-2024-002" -H "ngrok-skip-browser-warning: 1"
```

Response shape:
```json
{
  "studyId": "ST-2024-002",
  "phase": "PHASE_I",
  "studyStatus": "RECRUITING",
  "priority": "High",
  "performanceStatus": "AT_RISK",
  "studyTitle": "Phase I/II First-In-Human Open-label Trial to Assess Safety and Efficacy of STX-241 in Participants With Locally Advanced or Metastatic Non-small Cell Lung Cancer (NSCLC) Resistant to EGFR Tyrosine Ki",
  "asset": "ASS-0001",
  "assetLead": "Dr. Robert Garcia",
  "fsoModel": "Hybrid · IQVIA",
  "studySponsor": "OmniPath Pharma",
  "designation": "Priority Review",
  "targetEnrollment": 171,
  "milestones": {
    "plannedFpi": "17 Sept 2024",
    "actualFpi": {
      "value": "NA",
      "reason": "Actual FPI date is not available."
    },
    "plannedLpo": "17 May 2028",
    "forecastLpo": {
      "value": "NA",
      "reason": "Forecast LPO date is not available."
    }
  }
}
```

Field notes:
- `performanceStatus` is derived from the performance percentage rule.
- `fsoModel` combines the model and vendor into one display string.
- `actualFpi` and `forecastLpo` may return either a formatted date string or an `NA` object with `reason`.

---

## 2) Enrollment Cumulative Chart

Endpoints:
- `GET /study-overview/charts/enrollment-cumulative`
- `GET /study-overview/enrollment-cumulative` (alias)

Example:
```bash
curl -s "https://willfully-grumble-likely.ngrok-free.dev/api/v1/study-overview/charts/enrollment-cumulative?studyId=ST-2024-002&timeHorizon=Last%203%20Months" -H "ngrok-skip-browser-warning: 1"
```

Response shape:
```json
{
  "timeHorizon": "Last 3 Months",
  "studyId": "ST-2024-002",
  "window": {
    "startDate": "2026-02-26",
    "endDate": "2026-05-26"
  },
  "xAxis": ["MAR 2026", "APR 2026", "MAY 2026"],
  "series": {
    "planned": [59.0, 66.0, 74.0],
    "actual": [49.0, 54.0, 58.0],
    "forecasted": [50.0, 56.0, 60.0]
  },
  "points": [
    { "month": "MAR 2026", "planned": 59.0, "actual": 49.0, "forecasted": 50.0 },
    { "month": "APR 2026", "planned": 66.0, "actual": 54.0, "forecasted": 56.0 },
    { "month": "MAY 2026", "planned": 74.0, "actual": 58.0, "forecasted": 60.0 }
  ]
}
```

---

## 3) Enrollment Rate Monthly Chart

Endpoints:
- `GET /study-overview/charts/enrollment-rate`
- `GET /study-overview/enrollment-rate-monthly` (alias)

Example:
```bash
curl -s "https://willfully-grumble-likely.ngrok-free.dev/api/v1/study-overview/charts/enrollment-rate?studyId=ST-2024-002&timeHorizon=Last%203%20Months" -H "ngrok-skip-browser-warning: 1"
```

Response shape:
```json
{
  "timeHorizon": "Last 3 Months",
  "studyId": "ST-2024-002",
  "window": {
    "startDate": "2026-02-26",
    "endDate": "2026-05-26"
  },
  "xAxis": ["MAR 2026", "APR 2026", "MAY 2026"],
  "series": {
    "planned": [6.0, 7.0, 8.0],
    "actual": [7.0, 5.0, 4.0]
  },
  "points": [
    { "month": "MAR 2026", "planned": 6.0, "actual": 7.0 },
    { "month": "APR 2026", "planned": 7.0, "actual": 5.0 },
    { "month": "MAY 2026", "planned": 8.0, "actual": 4.0 }
  ]
}
```

---

## 4) Countries Breakdown (Expandable Sites)

Endpoints:
- `GET /study-overview/breakdown/countries`
- `GET /study-overview/charts/countries-breakdown` (alias)

Example:
```bash
curl -s "https://willfully-grumble-likely.ngrok-free.dev/api/v1/study-overview/breakdown/countries?studyId=ST-2024-002&timeHorizon=Full%20Study" -H "ngrok-skip-browser-warning: 1"
```

Response shape:
```json
{
  "timeHorizon": "Full Study",
  "studyId": "ST-2024-002",
  "countries": [
    {
      "country": "Mexico",
      "target": 44,
      "actual": 41,
      "percentEnrolled": 93.2,
      "sitesActive": 3,
      "avgRate": 13.7,
      "status": "OFF_TRACK",
      "sites": [
        {
          "siteId": "S0007",
          "siteName": "MEXI-Medical Center",
          "target": 10,
          "actual": 6,
          "percentEnrolled": 60.0,
          "status": "ON_HOLD"
        }
      ]
    }
  ]
}
```

Country-level status rule:
- `ON_TRACK` when `% Enrolled > 95`
- `OFF_TRACK` when `% Enrolled is 80 to 94`
- `AT_RISK` otherwise

---

## 5) Key Enrollment Milestones

Endpoints:
- `GET /study-overview/charts/milestones`
- `GET /study-overview/milestones` (alias)

Purpose:
- Returns key study milestones from an enrollment perspective only.
- Includes: `FSA`, `FSFV`, `LSFV`
- Excludes: `DBL`, `RC`

Variance rule:
- `varianceDays = actual_date - planned_date` (in days)
- `variance` text formatting:
  - `Pending` when either date is unavailable
  - `On time` when `varianceDays = 0`
  - `+Xd` for positive variance
  - `-Xd` for negative variance

Example:
```bash
curl -s "https://willfully-grumble-likely.ngrok-free.dev/api/v1/study-overview/charts/milestones?studyId=ST-2024-002" -H "ngrok-skip-browser-warning: 1"
```

Response shape:
```json
{
  "studyId": "ST-2024-002",
  "milestones": [
    {
      "code": "FSA",
      "milestone": "First Site Activated",
      "planned": "29 Dec 2023",
      "actual": "06 Jan 2024",
      "variance": "+8d",
      "varianceDays": 8
    },
    {
      "code": "FSFV",
      "milestone": "First Subject First Visit",
      "planned": "28 Mar 2024",
      "actual": "27 Mar 2024",
      "variance": "-1d",
      "varianceDays": -1
    },
    {
      "code": "LSFV",
      "milestone": "Last Subject First Visit",
      "planned": "02 Jul 2029",
      "actual": null,
      "variance": "Pending",
      "varianceDays": null
    }
  ]
}
```

---

## Frontend Fetch Example (JavaScript/TypeScript)

```javascript
const base = "https://willfully-grumble-likely.ngrok-free.dev/api/v1";
const params = new URLSearchParams({
  studyId: "ST-2024-002",
  timeHorizon: "Last 3 Months" // optional
});

const [kpi, cumulative, rate, countries, milestones] = await Promise.all([
  fetch(`${base}/study-overview/kpi-details?${params}`, {
    headers: { "ngrok-skip-browser-warning": "1" }
  }).then(r => r.json()),
  fetch(`${base}/study-overview/charts/enrollment-cumulative?${params}`, {
    headers: { "ngrok-skip-browser-warning": "1" }
  }).then(r => r.json()),
  fetch(`${base}/study-overview/charts/enrollment-rate?${params}`, {
    headers: { "ngrok-skip-browser-warning": "1" }
  }).then(r => r.json()),
  fetch(`${base}/study-overview/breakdown/countries?${params}`, {
    headers: { "ngrok-skip-browser-warning": "1" }
  }).then(r => r.json()),
  fetch(`${base}/study-overview/charts/milestones?studyId=${encodeURIComponent("ST-2024-002")}`, {
    headers: { "ngrok-skip-browser-warning": "1" }
  }).then(r => r.json())
]);
```
