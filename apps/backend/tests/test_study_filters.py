import pytest
from datetime import date

from eagle_hackathon.apps.backend.src.routers import fd_study_protocol as study_router


def test_parse_flexible_date_ddmmyy() -> None:
    parsed = study_router._parse_flexible_date("150126", is_end=False)
    assert parsed == date(2026, 1, 15)


def test_parse_flexible_date_mmyyyy_start_and_end() -> None:
    parsed_start = study_router._parse_flexible_date("012026", is_end=False)
    parsed_end = study_router._parse_flexible_date("012026", is_end=True)
    assert parsed_start == date(2026, 1, 1)
    assert parsed_end == date(2026, 1, 31)


def test_parse_flexible_date_yyyy_start_and_end() -> None:
    parsed_start = study_router._parse_flexible_date("2026", is_end=False)
    parsed_end = study_router._parse_flexible_date("2026", is_end=True)
    assert parsed_start == date(2026, 1, 1)
    assert parsed_end == date(2026, 12, 31)


def test_parse_flexible_date_invalid() -> None:
    with pytest.raises(ValueError):
        study_router._parse_flexible_date("20AB", is_end=False)


def test_build_common_filters_uses_resolved_columns(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        study_router,
        "_resolve_date_filter_columns",
        lambda: ("planned_fpi_date", "planned_fpi_date", "planned_lpo_date", "planned_lpo_date"),
    )

    where_clauses, params = study_router._build_common_study_filters(
        search=None,
        therapeutic_area=None,
        phase=None,
        status=None,
        portfolio=None,
        program=None,
        region=None,
        fpi_start_date=date(2026, 1, 1),
        fpi_end_date=date(2026, 12, 31),
        lpo_start_date=date(2026, 2, 1),
        lpo_end_date=date(2026, 6, 30),
    )

    assert "planned_fpi_date >= %s" in where_clauses
    assert "planned_fpi_date <= %s" in where_clauses
    assert "planned_lpo_date >= %s" in where_clauses
    assert "planned_lpo_date <= %s" in where_clauses
    assert len(params) == 4


def test_phase_conversion_helpers() -> None:
    assert study_router._normalize_phase_label("phase_ii") == "Ph II"
    assert study_router._phase_to_db_value("ph 3") == "PHASE_III"
    assert study_router._phase_to_db_value("unknown") is None


def test_build_trend_uses_target_when_actual_missing() -> None:
    trend = study_router._build_trend(actual=0, target=100)
    assert trend == [15.0, 30.0, 50.0, 70.0, 85.0, 100.0]
