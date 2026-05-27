from __future__ import annotations

from fastapi import HTTPException
import pytest
from sqlalchemy.exc import SQLAlchemyError

from eagle_hackathon.apps.backend.models.protocol_model import ProtocolSearchRequest
from eagle_hackathon.apps.backend.src.routers import fd_protocol_similarity as similarity_router


def test_search_protocols_success(monkeypatch: pytest.MonkeyPatch) -> None:
    captured = {}

    def fake_search(query, therapeutic_areas=None, top_k=10):
        captured["query"] = query
        captured["therapeutic_areas"] = therapeutic_areas
        captured["top_k"] = top_k
        return [{"protocol_id": "P-1", "score": 0.9}]

    monkeypatch.setattr(similarity_router, "search_similar_protocols", fake_search)

    request = ProtocolSearchRequest(
        summary="Summary text",
        inclusion_criteria="Inclusion text",
        exclusion_criteria="Exclusion text",
        therapeutic_areas=["Oncology"],
        top_k=3,
    )

    result = similarity_router.search_protocols(request)

    assert result["success"] is True
    assert result["total_results"] == 1
    assert "Summary text" in captured["query"]
    assert "Inclusion text" in captured["query"]
    assert "Exclusion text" in captured["query"]
    assert captured["therapeutic_areas"] == ["Oncology"]
    assert captured["top_k"] == 3


def test_search_protocols_db_error(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_search(*args, **kwargs):
        raise SQLAlchemyError("db down")

    monkeypatch.setattr(similarity_router, "search_similar_protocols", fake_search)

    with pytest.raises(HTTPException) as exc_info:
        similarity_router.search_protocols(ProtocolSearchRequest(summary="S"))

    assert exc_info.value.status_code == 503


def test_search_protocols_rejects_blank_summary() -> None:
    with pytest.raises(HTTPException) as exc_info:
        similarity_router.search_protocols(ProtocolSearchRequest(summary="   "))

    assert exc_info.value.status_code == 400


def test_search_protocols_rejects_invalid_top_k() -> None:
    with pytest.raises(HTTPException) as exc_info:
        similarity_router.search_protocols(ProtocolSearchRequest(summary="Summary", top_k=0))

    assert exc_info.value.status_code == 400


def test_search_protocols_rejects_non_model_payload() -> None:
    with pytest.raises(HTTPException) as exc_info:
        similarity_router.search_protocols({"summary": "Summary"})  # type: ignore[arg-type]

    assert exc_info.value.status_code == 400


def test_get_protocol_detail_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(similarity_router, "get_protocol_details", lambda _protocol_id: None)

    result = similarity_router.get_protocol_detail("P-404")

    assert result == {"success": False, "message": "Protocol not found"}


def test_get_protocol_detail_success(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        similarity_router,
        "get_protocol_details",
        lambda _protocol_id: {"protocol": {"id": "P-1"}},
    )

    result = similarity_router.get_protocol_detail("P-1")

    assert result == {"success": True, "protocol": {"id": "P-1"}}


def test_get_protocol_detail_unexpected_error(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_get_details(_protocol_id):
        raise RuntimeError("boom")

    monkeypatch.setattr(similarity_router, "get_protocol_details", fake_get_details)

    with pytest.raises(HTTPException) as exc_info:
        similarity_router.get_protocol_detail("P-1")

    assert exc_info.value.status_code == 500


def test_get_protocol_detail_rejects_blank_id() -> None:
    with pytest.raises(HTTPException) as exc_info:
        similarity_router.get_protocol_detail("   ")

    assert exc_info.value.status_code == 400


@pytest.mark.parametrize("top_k", [-1, 0, 101, 999])
def test_search_protocols_rejects_out_of_range_top_k(top_k: int) -> None:
    with pytest.raises(HTTPException) as exc_info:
        similarity_router.search_protocols(ProtocolSearchRequest(summary="Summary", top_k=top_k))

    assert exc_info.value.status_code == 400


@pytest.mark.parametrize(
    ("field_name", "field_value"),
    [
        ("therapeutic_areas", [" "]),
        ("inclusion_criteria", 123),
        ("exclusion_criteria", []),
    ],
)
def test_search_protocols_rejects_malformed_optional_fields(field_name: str, field_value) -> None:
    request = ProtocolSearchRequest(summary="Summary")
    setattr(request, field_name, field_value)

    with pytest.raises(HTTPException) as exc_info:
        similarity_router.search_protocols(request)

    assert exc_info.value.status_code == 400


@pytest.mark.parametrize("protocol_id", [None, 123, [], {}])
def test_get_protocol_detail_rejects_non_string_ids(protocol_id) -> None:
    with pytest.raises(HTTPException) as exc_info:
        similarity_router.get_protocol_detail(protocol_id)  # type: ignore[arg-type]

    assert exc_info.value.status_code == 400
