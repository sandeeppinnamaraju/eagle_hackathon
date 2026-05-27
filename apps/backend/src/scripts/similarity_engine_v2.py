from __future__ import annotations

import re
from functools import lru_cache
from typing import Any, Dict, List, Optional, Sequence, Tuple

import numpy as np
from rank_bm25 import BM25Okapi
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

try:
    from services.protocol_service import get_protocols as get_all_protocols
except ImportError:
    from eagle_hackathon.apps.backend.services.protocol_service import get_protocols as get_all_protocols


# ============================================================
# TEXT NORMALIZATION / TOKENIZATION
# ============================================================

TOKEN_PATTERN = re.compile(r"[A-Za-z0-9]+(?:[-/][A-Za-z0-9]+)*")


def normalize_text(value: Any) -> str:
    """
    Convert any value to a clean lowercase string.
    """
    if value is None:
        return ""
    return str(value).replace("\r", " ").replace("\n", " ").strip().lower()


def tokenize(value: Any) -> List[str]:
    """
    Tokenize text for BM25.
    """
    text_value = normalize_text(value)
    return TOKEN_PATTERN.findall(text_value)


def _row_to_dict(row: Any, columns: Sequence[str]) -> Dict[str, Any]:
    return dict(zip(columns, row))


# ============================================================
# CRITERIA PREVIEW HELPERS
# ============================================================

def _split_criteria_to_bullets(text_value: Optional[str]) -> List[str]:
    if not text_value:
        return []

    lines: List[str] = []
    for raw_line in text_value.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        if line.startswith("* "):
            line = line[2:].strip()
        elif line.startswith("- "):
            line = line[2:].strip()
        elif line.startswith("• "):
            line = line[2:].strip()

        if len(line) >= 8:
            lines.append(line)

    return lines


def _match_label(score: float) -> str:
    if score >= 70:
        return "High match"
    if score >= 40:
        return "Moderate match"
    return "Low match"


def _build_weighted_document(protocol: Dict[str, Any]) -> str:
    """
    Build a weighted searchable document from protocol fields.
    """
    title = normalize_text(protocol.get("title"))
    therapeutic_area = normalize_text(protocol.get("therapeutic_area"))
    indication = normalize_text(protocol.get("indication"))
    summary = normalize_text(protocol.get("full_summary"))
    inclusion = normalize_text(protocol.get("inclusion_criteria"))
    exclusion = normalize_text(protocol.get("exclusion_criteria"))
    lessons = normalize_text(protocol.get("lessons_learned"))

    # Heavier weighting for clinically descriptive fields
    parts = [
        (title + " ") * 5,
        (therapeutic_area + " ") * 2,
        (indication + " ") * 3,
        (summary + " ") * 4,
        (inclusion + " ") * 2,
        (exclusion + " ") * 2,
        (lessons + " ") * 1,
    ]

    return " ".join(parts).strip()


def _manual_domain_boosts(query_text: str, protocol: Dict[str, Any]) -> float:
    """
    Small deterministic boosts for obvious clinical term matches.
    """
    boost = 0.0

    title = normalize_text(protocol.get("title"))
    indication = normalize_text(protocol.get("indication"))
    phase = normalize_text(protocol.get("phase"))

    query_has_nsclc = "nsclc" in query_text
    query_has_egfr = "egfr" in query_text
    query_has_metastatic = "metastatic" in query_text
    query_has_phase_ii = "phase ii" in query_text or "phase 2" in query_text

    if query_has_nsclc and "nsclc" in (title + " " + indication):
        boost += 0.10

    if query_has_egfr and "egfr" in title:
        boost += 0.10

    if query_has_metastatic and "metastatic" in title:
        boost += 0.05

    if query_has_phase_ii and ("phase_ii" in phase or "phase ii" in phase):
        boost += 0.05

    return boost


# ============================================================
# BUILD SEARCH MODEL
# ============================================================

def build_search_corpus() -> Tuple[List[Dict[str, Any]], List[str], List[List[str]]]:
    rows, columns = get_all_protocols()

    protocols: List[Dict[str, Any]] = []
    corpus: List[str] = []
    tokenized_corpus: List[List[str]] = []

    for row in rows:
        protocol = _row_to_dict(row, columns)
        protocols.append(protocol)

        weighted_doc = _build_weighted_document(protocol)
        corpus.append(weighted_doc)
        tokenized_corpus.append(tokenize(weighted_doc))

    return protocols, corpus, tokenized_corpus


def build_search_models():
    """
    Build TF-IDF and BM25 models over the protocol corpus.
    """
    protocols, corpus, tokenized_corpus = build_search_corpus()

    vectorizer = TfidfVectorizer(
        stop_words="english",
        lowercase=True,
        ngram_range=(1, 2),
        max_features=20000,
    )
    tfidf_matrix = vectorizer.fit_transform(corpus)

    bm25 = BM25Okapi(tokenized_corpus)

    return protocols, vectorizer, tfidf_matrix, bm25


# ============================================================
# SEARCH SIMILAR PROTOCOLS
# ============================================================

def search_similar_protocols(
    query: str,
    therapeutic_areas: Optional[List[str]] = None,
    top_k: int = 10,
) -> List[Dict[str, Any]]:
    """
    Hybrid search:
    - BM25 for long clinical documents
    - TF-IDF cosine for lexical similarity
    - manual domain boosts for clinical terms
    - therapeutic area filtering

    Returns frontend-ready ranked cards.
    """
    protocols, vectorizer, tfidf_matrix, bm25 = build_search_models()

    if not protocols:
        return []

    query_text = normalize_text(query)

    # Boost the query a little so clinical intent is better preserved
    boosted_query = f"""
    {query}
    {query}
    phase ii
    phase iii
    oncology
    nsclc
    metastatic
    egfr
    tki
    biologic
    immunotherapy
    """
    boosted_query = normalize_text(boosted_query)

    query_tokens = tokenize(boosted_query)

    # BM25 scores
    bm25_scores = np.array(bm25.get_scores(query_tokens), dtype=float)
    bm25_max = float(np.max(bm25_scores)) if len(bm25_scores) else 0.0
    bm25_norm = bm25_scores / bm25_max if bm25_max > 0 else bm25_scores

    # TF-IDF cosine scores
    query_vector = vectorizer.transform([boosted_query])
    tfidf_scores = cosine_similarity(query_vector, tfidf_matrix)[0]

    # Combined score
    combined_scores = (0.60 * bm25_norm) + (0.40 * tfidf_scores)

    ranked_results: List[Dict[str, Any]] = []

    for idx, base_score in enumerate(combined_scores):
        protocol = protocols[idx]

        # Therapeutic area filtering
        if therapeutic_areas:
            protocol_ta = protocol.get("therapeutic_area")
            if protocol_ta not in therapeutic_areas:
                continue

        final_score = float(base_score) + _manual_domain_boosts(query_text, protocol)

        similarity_score = round(min(max(final_score * 100, 0.0), 100.0), 2)

        inclusion_preview = _split_criteria_to_bullets(
            protocol.get("inclusion_criteria")
        )[:2]

        exclusion_preview = _split_criteria_to_bullets(
            protocol.get("exclusion_criteria")
        )[:2]

        ranked_results.append({
            "rank": 0,
            "protocol_id": protocol.get("protocol_id"),
            "title": protocol.get("title"),
            "phase": protocol.get("phase"),
            "therapeutic_area": protocol.get("therapeutic_area"),
            "indication": protocol.get("indication"),
            "similarity_score": similarity_score,
            "match_label": _match_label(similarity_score),
            "inclusion_preview": inclusion_preview,
            "exclusion_preview": exclusion_preview,
            "protocol": protocol,
        })

    ranked_results.sort(
        key=lambda item: item["similarity_score"],
        reverse=True
    )

    for idx, item in enumerate(ranked_results, start=1):
        item["rank"] = idx

    return ranked_results[:top_k]
