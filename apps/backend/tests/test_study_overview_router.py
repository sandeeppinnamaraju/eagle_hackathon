from datetime import date

import pytest

from eagle_hackathon.apps.backend.src.routers import fd_study_overview as overview_router


class _FakeCursor:
    def __init__(self, fetchone_values, fetchall_values=None):
        self.fetchone_values = list(fetchone_values)
        self.fetchall_values = list(fetchall_values or [])
        self.executed = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def execute(self, query, params=None):
        self.executed.append((query, params))

    def fetchone(self):
        return self.fetchone_values.pop(0)

    def fetchall(self):
        return self.fetchall_values.pop(0)


class _FakeConnection:
    def __init__(self, cursor: _FakeCursor):
        self._cursor = cursor

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def cursor(self):
        return self._cursor


class _FakeRequest:
    def __init__(self, method: str):
        self.method = method


def test_normalize_time_horizon_valid_values() -> None:
    assert overview_router._normalize_time_horizon("Full Study") == "full study"
    assert overview_router._normalize_time_horizon("since FPI") == "since fpi"
    assert overview_router._normalize_time_horizon("Last 3 Months") == "last 3 months"


def test_normalize_time_horizon_invalid_value() -> None:
    assert overview_router._normalize_time_horizon("last quarter") is None


def test_subtract_months_handles_month_length() -> None:
    assert overview_router._subtract_months(date(2026, 5, 31), 3) == date(2026, 2, 28)


def test_resolve_since_fpi_start_date_uses_enrollment_tables() -> None:
    cursor = _FakeCursor(fetchone_values=[(date(2026, 1, 15),)])
    table_columns = {
        "enrollment_timeline": {"study_id", "period_date"},
        "enrollment_rate": {"study_id", "period_date"},
    }

    resolved_date, error = overview_router._resolve_since_fpi_start_date(cursor, table_columns, "S-100")

    assert resolved_date == date(2026, 1, 15)
    assert error is None
    assert "public.enrollment_timeline" in cursor.executed[0][0]
    assert "public.enrollment_rate" in cursor.executed[0][0]
    assert cursor.executed[0][1] == ["S-100", "S-100"]


def test_resolve_since_fpi_start_date_returns_error_when_enrollment_tables_unavailable() -> None:
    cursor = _FakeCursor(fetchone_values=[])

    resolved_date, error = overview_router._resolve_since_fpi_start_date(cursor, {}, "S-100")

    assert resolved_date is None
    assert error == "Enrollment timeline/rate period_date columns are not available."


def test_kpi_result_returns_na_with_reason_when_value_is_none() -> None:
    result = overview_router._kpi_result(None, reason_if_na="Planned enrollment data is not available.")

    assert result == {"value": "NA", "reason": "Planned enrollment data is not available."}


def test_kpi_result_returns_na_with_reason_when_value_is_zero() -> None:
    result = overview_router._kpi_result(0, reason_if_na="Enrollment data is not available.")

    assert result == {"value": "NA", "reason": "Enrollment data is not available."}


def test_kpi_result_prefers_specific_zero_reason() -> None:
    result = overview_router._kpi_result(
        0,
        reason_if_na="Enrollment data is not available.",
        reason_if_zero="Enrollment data not available for selected period.",
    )

    assert result == {"value": "NA", "reason": "Enrollment data not available for selected period."}


def test_get_study_overview_kpi_details_returns_405_for_non_get_request() -> None:
    response = overview_router.get_study_overview_kpi_details(
        request=_FakeRequest("POST"),
        time_horizon="Full Study",
        study_id="S-100",
    )

    assert response.status_code == 405


def test_get_study_overview_kpi_details_rejects_blank_study_id() -> None:
    response = overview_router.get_study_overview_kpi_details(
        time_horizon="Full Study",
        study_id="   ",
    )

    assert response.status_code == 400


def test_get_study_overview_kpi_details_rejects_non_string_time_horizon() -> None:
    response = overview_router.get_study_overview_kpi_details(
        time_horizon=123,
        study_id="S-100",
    )

    assert response.status_code == 400


@pytest.mark.parametrize("invalid_study_id", [None, 123, [], {}])
def test_get_study_overview_kpi_details_rejects_non_string_study_id(invalid_study_id) -> None:
    response = overview_router.get_study_overview_kpi_details(
        time_horizon="Full Study",
        study_id=invalid_study_id,
    )

    assert response.status_code == 400


@pytest.mark.parametrize("invalid_horizon", [[], {}, "", "   ", "full", "last quarter"]) 
def test_get_study_overview_kpi_details_rejects_invalid_time_horizon_values(invalid_horizon) -> None:
    response = overview_router.get_study_overview_kpi_details(
        time_horizon=invalid_horizon,
        study_id="S-100",
    )

    assert response.status_code == 400


def test_get_study_overview_kpi_details_returns_actual_and_planned_kpis(monkeypatch) -> None:
    # enrollmentVsPlan: 1 row returned from LAG delta query; actual_delta=80, planned_delta=100
    # enrollmentRate:   1 row, actual_sum=10 (monthly), planned_sum=13 -> weekly = /4.333
    # sitesActivated:   1 row, actual=12, planned=15
    # countriesActivated: 1 row, actual=4, planned=6
    cursor = _FakeCursor(
        fetchone_values=[
            (1,),
            (1, 80, 100),
            (1, 10, 13),
            (1, 12, 15),
            (1, 4, 6),
        ]
    )
    table_columns = {
        "enrollment_timeline": {"study_id", "period_date", "enrolled_this_period", "planned_cumulative"},
        "enrollment_rate": {"study_id", "period_date", "actual_rate", "planned_rate"},
        "kpi_snapshot": {
            "study_id",
            "snapshot_date",
            "sites_activated",
            "sites_planned",
            "countries_activated",
            "countries_planned",
        },
    }

    monkeypatch.setattr(overview_router, "get_conn_params", lambda: {"password": "test"})
    monkeypatch.setattr(overview_router, "_get_public_table_columns", lambda _: table_columns)
    monkeypatch.setattr(overview_router.psycopg2, "connect", lambda **_: _FakeConnection(cursor))

    response = overview_router.get_study_overview_kpi_details(
        time_horizon="Full Study",
        study_id="S-100",
    )

    assert response["kpis"]["enrollmentVsPlan"] == {
        "percentage": {"value": 80.0, "reason": None},
        "actualEnrollments": 80.0,
        "plannedEnrollments": 100.0,
    }
    assert response["kpis"]["enrollmentRate"] == {
        "percentage": {"value": round((round(10 / 4.333, 2) / round(13 / 4.333, 2)) * 100, 2), "reason": None},
        "actualEnrollmentRatePerWeek": round(10 / 4.333, 2),
        "plannedEnrollmentRatePerWeek": round(13 / 4.333, 2),
    }
    assert response["kpis"]["sitesActivated"] == {
        "value": {"value": 12.0, "reason": None},
        "actualSitesActivated": 12,
        "plannedSitesActivated": 15,
    }
    assert response["kpis"]["countriesActivated"] == {
        "value": {"value": 4.0, "reason": None},
        "actualCountriesActivated": 4,
        "plannedCountriesActivated": 6,
    }


def test_get_study_overview_kpi_details_rejects_unknown_study_id(monkeypatch) -> None:
    cursor = _FakeCursor(fetchone_values=[None, None, None])
    table_columns = {
        "enrollment_timeline": {"study_id"},
        "enrollment_rate": {"study_id"},
        "kpi_snapshot": {"study_id"},
    }

    monkeypatch.setattr(overview_router, "get_conn_params", lambda: {"password": "test"})
    monkeypatch.setattr(overview_router, "_get_public_table_columns", lambda _: table_columns)
    monkeypatch.setattr(overview_router.psycopg2, "connect", lambda **_: _FakeConnection(cursor))

    response = overview_router.get_study_overview_kpi_details(
        time_horizon="Full Study",
        study_id="ST-2024-02",
    )

    assert response.status_code == 400
    assert response.body == b'{"message":"Invalid studyId"}'


def test_get_enrollment_cumulative_chart_returns_monthly_series(monkeypatch) -> None:
    cursor = _FakeCursor(
        fetchone_values=[(1,)],
        fetchall_values=[
            [
                (date(2026, 1, 1), 100.0, 90.0, 110.0),
                (date(2026, 2, 1), 160.0, 140.0, 175.0),
            ]
        ],
    )
    table_columns = {
        "enrollment_timeline": {
            "study_id",
            "period_date",
            "planned_cumulative",
            "actual_cumulative",
            "forecast_cumulative",
        },
        "enrollment_rate": {"study_id"},
        "kpi_snapshot": {"study_id"},
    }

    monkeypatch.setattr(overview_router, "get_conn_params", lambda: {"password": "test"})
    monkeypatch.setattr(overview_router, "_get_public_table_columns", lambda _: table_columns)
    monkeypatch.setattr(overview_router.psycopg2, "connect", lambda **_: _FakeConnection(cursor))

    response = overview_router.get_enrollment_cumulative_chart(
        time_horizon="Full Study",
        study_id="S-100",
    )

    assert response["timeHorizon"] == "Full Study"
    assert response["studyId"] == "S-100"
    assert response["xAxis"] == ["JAN 2026", "FEB 2026"]
    assert response["series"] == {
        "planned": [100.0, 160.0],
        "actual": [90.0, 140.0],
        "forecasted": [110.0, 175.0],
    }
    assert response["points"] == [
        {"month": "JAN 2026", "planned": 100.0, "actual": 90.0, "forecasted": 110.0},
        {"month": "FEB 2026", "planned": 160.0, "actual": 140.0, "forecasted": 175.0},
    ]


def test_get_enrollment_cumulative_chart_rejects_unknown_study_id(monkeypatch) -> None:
    cursor = _FakeCursor(fetchone_values=[None, None, None])
    table_columns = {
        "enrollment_timeline": {"study_id"},
        "enrollment_rate": {"study_id"},
        "kpi_snapshot": {"study_id"},
    }

    monkeypatch.setattr(overview_router, "get_conn_params", lambda: {"password": "test"})
    monkeypatch.setattr(overview_router, "_get_public_table_columns", lambda _: table_columns)
    monkeypatch.setattr(overview_router.psycopg2, "connect", lambda **_: _FakeConnection(cursor))

    response = overview_router.get_enrollment_cumulative_chart(
        time_horizon="Full Study",
        study_id="ST-2024-02",
    )

    assert response.status_code == 400
    assert response.body == b'{"message":"Invalid studyId"}'


def test_get_enrollment_rate_monthly_chart_returns_monthly_series(monkeypatch) -> None:
    cursor = _FakeCursor(
        fetchone_values=[(1,)],
        fetchall_values=[
            [
                (date(2026, 1, 1), 32.0, 26.0),
                (date(2026, 2, 1), 40.0, 31.0),
            ]
        ],
    )
    table_columns = {
        "enrollment_timeline": {"study_id"},
        "enrollment_rate": {"study_id", "period_date", "planned_rate", "actual_rate"},
        "kpi_snapshot": {"study_id"},
    }

    monkeypatch.setattr(overview_router, "get_conn_params", lambda: {"password": "test"})
    monkeypatch.setattr(overview_router, "_get_public_table_columns", lambda _: table_columns)
    monkeypatch.setattr(overview_router.psycopg2, "connect", lambda **_: _FakeConnection(cursor))

    response = overview_router.get_enrollment_rate_monthly_chart(
        time_horizon="Full Study",
        study_id="S-100",
    )

    assert response["timeHorizon"] == "Full Study"
    assert response["studyId"] == "S-100"
    assert response["xAxis"] == ["JAN 2026", "FEB 2026"]
    assert response["series"] == {
        "planned": [32.0, 40.0],
        "actual": [26.0, 31.0],
    }
    assert response["points"] == [
        {"month": "JAN 2026", "planned": 32.0, "actual": 26.0},
        {"month": "FEB 2026", "planned": 40.0, "actual": 31.0},
    ]


def test_get_enrollment_rate_monthly_chart_rejects_unknown_study_id(monkeypatch) -> None:
    cursor = _FakeCursor(fetchone_values=[None, None, None])
    table_columns = {
        "enrollment_timeline": {"study_id"},
        "enrollment_rate": {"study_id"},
        "kpi_snapshot": {"study_id"},
    }

    monkeypatch.setattr(overview_router, "get_conn_params", lambda: {"password": "test"})
    monkeypatch.setattr(overview_router, "_get_public_table_columns", lambda _: table_columns)
    monkeypatch.setattr(overview_router.psycopg2, "connect", lambda **_: _FakeConnection(cursor))

    response = overview_router.get_enrollment_rate_monthly_chart(
        time_horizon="Full Study",
        study_id="ST-2024-02",
    )

    assert response.status_code == 400
    assert response.body == b'{"message":"Invalid studyId"}'


def test_get_country_breakdown_returns_country_rows_with_nested_sites(monkeypatch) -> None:
    cursor = _FakeCursor(
        fetchone_values=[(1,)],
        fetchall_values=[
            [
                ("India", 100, 80, 80.0, 10, 5.5),
                ("USA", 120, 60, 50.0, 8, 4.0),
            ],
            [
                (
                    "India",
                    "IN-001",
                    "Bengaluru Site",
                    60,
                    50,
                    83.33,
                    "ACTIVE",
                ),
                (
                    "USA",
                    "US-001",
                    "Boston Site",
                    70,
                    30,
                    42.85,
                    "AT_RISK",
                ),
            ],
        ],
    )
    table_columns = {
        "enrollment_timeline": {"study_id"},
        "enrollment_rate": {"study_id"},
        "kpi_snapshot": {"study_id"},
        "country_breakdown": {
            "study_id",
            "country",
            "target_enrollment",
            "actual_enrollment",
            "enrollment_percent",
            "sites_active",
            "avg_enrollment_rate",
        },
        "site_breakdown": {
            "study_id",
            "country",
            "site_id",
            "site_name",
            "target_enrollment",
            "actual_enrollment",
            "enrollment_percent",
            "enrollment_rate",
            "site_status",
        },
    }

    monkeypatch.setattr(overview_router, "get_conn_params", lambda: {"password": "test"})
    monkeypatch.setattr(overview_router, "_get_public_table_columns", lambda _: table_columns)
    monkeypatch.setattr(overview_router.psycopg2, "connect", lambda **_: _FakeConnection(cursor))

    response = overview_router.get_country_breakdown(study_id="S-100")

    assert response["studyId"] == "S-100"
    assert len(response["countries"]) == 2
    assert response["countries"][0]["country"] == "India"
    assert response["countries"][0]["target"] == 100
    assert response["countries"][0]["actual"] == 80
    assert response["countries"][0]["percentEnrolled"] == 80.0
    assert response["countries"][0]["sitesActive"] == 10
    assert response["countries"][0]["avgRate"] == 5.5
    assert response["countries"][0]["status"] == "OFF_TRACK"
    assert len(response["countries"][0]["sites"]) == 1
    assert response["countries"][0]["sites"][0]["siteId"] == "IN-001"
    assert response["countries"][0]["sites"][0] == {
        "siteId": "IN-001",
        "siteName": "Bengaluru Site",
        "target": 60,
        "actual": 50,
        "percentEnrolled": 83.33,
        "status": "ACTIVE",
    }


def test_get_country_breakdown_rejects_unknown_study_id(monkeypatch) -> None:
    cursor = _FakeCursor(fetchone_values=[None, None, None])
    table_columns = {
        "enrollment_timeline": {"study_id"},
        "enrollment_rate": {"study_id"},
        "kpi_snapshot": {"study_id"},
    }

    monkeypatch.setattr(overview_router, "get_conn_params", lambda: {"password": "test"})
    monkeypatch.setattr(overview_router, "_get_public_table_columns", lambda _: table_columns)
    monkeypatch.setattr(overview_router.psycopg2, "connect", lambda **_: _FakeConnection(cursor))

    response = overview_router.get_country_breakdown(study_id="ST-2024-02")

    assert response.status_code == 400
    assert response.body == b'{"message":"Invalid studyId"}'


def test_country_breakdown_defaults_time_horizon_to_full_study(monkeypatch) -> None:
    cursor = _FakeCursor(
        fetchone_values=[(1,)],
        fetchall_values=[[], []],
    )
    table_columns = {
        "enrollment_timeline": {"study_id"},
        "enrollment_rate": {"study_id"},
        "kpi_snapshot": {"study_id"},
        "country_breakdown": {
            "study_id",
            "country",
            "target_enrollment",
            "actual_enrollment",
            "enrollment_percent",
            "sites_active",
            "avg_enrollment_rate",
        },
        "site_breakdown": {
            "study_id",
            "country",
            "site_id",
            "site_name",
            "target_enrollment",
            "actual_enrollment",
            "enrollment_percent",
            "enrollment_rate",
            "site_status",
        },
    }

    monkeypatch.setattr(overview_router, "get_conn_params", lambda: {"password": "test"})
    monkeypatch.setattr(overview_router, "_get_public_table_columns", lambda _: table_columns)
    monkeypatch.setattr(overview_router.psycopg2, "connect", lambda **_: _FakeConnection(cursor))

    response = overview_router.get_country_breakdown(study_id="S-100")

    assert response["timeHorizon"] == "Full Study"


def test_enrollment_rate_chart_defaults_time_horizon_to_full_study(monkeypatch) -> None:
    cursor = _FakeCursor(
        fetchone_values=[(1,)],
        fetchall_values=[[]],
    )
    table_columns = {
        "enrollment_timeline": {"study_id"},
        "enrollment_rate": {"study_id", "period_date", "planned_rate", "actual_rate"},
        "kpi_snapshot": {"study_id"},
    }

    monkeypatch.setattr(overview_router, "get_conn_params", lambda: {"password": "test"})
    monkeypatch.setattr(overview_router, "_get_public_table_columns", lambda _: table_columns)
    monkeypatch.setattr(overview_router.psycopg2, "connect", lambda **_: _FakeConnection(cursor))

    response = overview_router.get_enrollment_rate_monthly_chart(study_id="S-100")

    assert response["timeHorizon"] == "Full Study"


def test_enrollment_cumulative_chart_defaults_time_horizon_to_full_study(monkeypatch) -> None:
    cursor = _FakeCursor(
        fetchone_values=[(1,)],
        fetchall_values=[[]],
    )
    table_columns = {
        "enrollment_timeline": {
            "study_id",
            "period_date",
            "planned_cumulative",
            "actual_cumulative",
            "forecast_cumulative",
        },
        "enrollment_rate": {"study_id"},
        "kpi_snapshot": {"study_id"},
    }

    monkeypatch.setattr(overview_router, "get_conn_params", lambda: {"password": "test"})
    monkeypatch.setattr(overview_router, "_get_public_table_columns", lambda _: table_columns)
    monkeypatch.setattr(overview_router.psycopg2, "connect", lambda **_: _FakeConnection(cursor))

    response = overview_router.get_enrollment_cumulative_chart(study_id="S-100")

    assert response["timeHorizon"] == "Full Study"


def test_kpi_details_defaults_time_horizon_to_full_study(monkeypatch) -> None:
    cursor = _FakeCursor(
        fetchone_values=[
            (1,),
            (0, 0, 0),
            (0, 0, 0),
            (0, 0, 0),
            (0, 0, 0),
        ]
    )
    table_columns = {
        "enrollment_timeline": {"study_id", "period_date", "enrolled_this_period", "planned_cumulative"},
        "enrollment_rate": {"study_id", "period_date", "actual_rate", "planned_rate"},
        "kpi_snapshot": {
            "study_id",
            "snapshot_date",
            "sites_activated",
            "sites_planned",
            "countries_activated",
            "countries_planned",
        },
    }

    monkeypatch.setattr(overview_router, "get_conn_params", lambda: {"password": "test"})
    monkeypatch.setattr(overview_router, "_get_public_table_columns", lambda _: table_columns)
    monkeypatch.setattr(overview_router.psycopg2, "connect", lambda **_: _FakeConnection(cursor))

    response = overview_router.get_study_overview_kpi_details(study_id="S-100")

    assert response["timeHorizon"] == "Full Study"


def test_get_study_overview_summary_returns_requested_fields(monkeypatch) -> None:
    cursor = _FakeCursor(
        fetchone_values=[
            (1,),
            (
                "S-100",
                "PHASE_III",
                "RECRUITING",
                "High",
                "Study title",
                "OMP-770",
                "Dr. Lisa Miller",
                "Full Service Outsourcing (FSO)",
                "Hybrid",
                "ApexBio Research",
                "ApexBio Research",
                "Fast Track",
                148,
                date(2024, 3, 28),
                date(2029, 9, 30),
                96.0,
                date(2024, 3, 27),
            ),
        ]
    )
    table_columns = {
        "enrollment_timeline": {"study_id"},
        "enrollment_rate": {"study_id"},
        "kpi_snapshot": {"study_id"},
        "studies": {
            "study_id",
            "phase",
            "study_status",
            "project_priority",
            "title",
            "asset_number",
            "asset_lead",
            "fso_model",
            "fso_model_vendor",
            "sponsor_company",
            "study_sponsor",
            "study_designation",
            "target_enrollment",
            "planned_fpi_date",
            "planned_lpo_date",
            "enrollment_plan_percent",
            "actual_fpi_date",
        },
    }

    monkeypatch.setattr(overview_router, "get_conn_params", lambda: {"password": "test"})
    monkeypatch.setattr(overview_router, "_get_public_table_columns", lambda _: table_columns)
    monkeypatch.setattr(overview_router.psycopg2, "connect", lambda **_: _FakeConnection(cursor))

    response = overview_router.get_study_overview_summary(study_id="S-100")

    assert response == {
        "studyId": "S-100",
        "phase": "PHASE_III",
        "studyStatus": "RECRUITING",
        "priority": "High",
        "performanceStatus": "ON_TRACK",
        "studyTitle": "Study title",
        "asset": "OMP-770",
        "assetLead": "Dr. Lisa Miller",
        "fsoModel": "Full Service Outsourcing (FSO) · Hybrid",
        "studySponsor": "ApexBio Research",
        "designation": "Fast Track",
        "targetEnrollment": 148,
        "milestones": {
            "plannedFpi": "28 Mar 2024",
            "actualFpi": "27 Mar 2024",
            "plannedLpo": "30 Sept 2029",
            "forecastLpo": {"value": "NA", "reason": "Forecast LPO date is not available."},
        },
    }


def test_get_study_overview_summary_rejects_unknown_study_id(monkeypatch) -> None:
    cursor = _FakeCursor(fetchone_values=[None, None, None])
    table_columns = {
        "enrollment_timeline": {"study_id"},
        "enrollment_rate": {"study_id"},
        "kpi_snapshot": {"study_id"},
        "studies": {"study_id"},
    }

    monkeypatch.setattr(overview_router, "get_conn_params", lambda: {"password": "test"})
    monkeypatch.setattr(overview_router, "_get_public_table_columns", lambda _: table_columns)
    monkeypatch.setattr(overview_router.psycopg2, "connect", lambda **_: _FakeConnection(cursor))

    response = overview_router.get_study_overview_summary(study_id="ST-404")

    assert response.status_code == 400
    assert response.body == b'{"message":"Invalid studyId"}'
