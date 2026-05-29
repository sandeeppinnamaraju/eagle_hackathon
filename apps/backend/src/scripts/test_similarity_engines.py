from __future__ import annotations

import argparse
import importlib.util
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Tuple

REPO_ROOT = Path(__file__).resolve().parents[4]
BACKEND_DIR = REPO_ROOT / "apps" / "backend"

# Add backend directory to sys.path so services imports resolve correctly.
sys.path.insert(0, str(BACKEND_DIR))


def load_module_from_path(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, str(path))
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load module {name} from {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def load_engines():
    protocol_service = load_module_from_path(
        "protocol_service",
        BACKEND_DIR / "services" / "protocol_service.py",
    )
    engine_v1 = load_module_from_path(
        "similarity_engine_v1",
        BACKEND_DIR / "src" / "scripts" / "similarity_engine.py",
    )
    engine_v2 = load_module_from_path(
        "similarity_engine_v2",
        BACKEND_DIR / "src" / "scripts" / "similarity_engine_v2.py",
    )

    if not hasattr(engine_v2, "get_all_protocols"):
        engine_v2.get_all_protocols = protocol_service.get_protocols

    return protocol_service, engine_v1, engine_v2


def compare_results(
    results_v1: List[Dict[str, Any]],
    results_v2: List[Dict[str, Any]],
) -> Dict[str, Any]:
    ids_v1 = [item["protocol_id"] for item in results_v1]
    ids_v2 = [item["protocol_id"] for item in results_v2]
    set_v1 = set(ids_v1)
    set_v2 = set(ids_v2)
    overlap = set_v1 & set_v2

    common_ranks: List[Tuple[int, int]] = []
    for idx1, protocol_id in enumerate(ids_v1, start=1):
        if protocol_id in set_v2:
            idx2 = ids_v2.index(protocol_id) + 1
            common_ranks.append((idx1, idx2))

    rank_score = 0.0
    if common_ranks:
        rank_score = 1.0 - (
            sum(abs(r1 - r2) for r1, r2 in common_ranks)
            / (len(common_ranks) * len(results_v1))
        )
        rank_score = max(0.0, min(rank_score, 1.0))

    score_diffs = []
    for item in results_v1:
        match = next(
            (other for other in results_v2 if other["protocol_id"] == item["protocol_id"]),
            None,
        )
        if match is not None:
            score_diffs.append(abs(item["similarity_score"] - match["similarity_score"]))

    return {
        "top_k_overlap": len(overlap),
        "top_1_match": ids_v1[:1] == ids_v2[:1],
        "top_3_overlap": len(set(ids_v1[:3]) & set(ids_v2[:3])),
        "top_5_overlap": len(set(ids_v1[:5]) & set(ids_v2[:5])),
        "rank_agreement_score": round(rank_score, 4),
        "average_score_diff": round(sum(score_diffs) / len(score_diffs), 4) if score_diffs else None,
    }


def print_comparison(
    query: str,
    results_v1: List[Dict[str, Any]],
    results_v2: List[Dict[str, Any]],
    metrics: Dict[str, Any],
) -> None:
    print("\n" + "=" * 80)
    print(f"Query: {query}")
    print("=" * 80)
    print("Metrics:")
    for key, value in metrics.items():
        print(f"  {key}: {value}")

    print("\nTop results comparison:\n")
    print(
        f"{'Rank':<5} {'V1 Protocol ID':<20} {'V1 Score':<10} {'V2 Protocol ID':<20} {'V2 Score':<10}"
    )
    print("-" * 80)
    for rank in range(max(len(results_v1), len(results_v2))):
        item_v1 = results_v1[rank] if rank < len(results_v1) else None
        item_v2 = results_v2[rank] if rank < len(results_v2) else None
        print(
            f"{rank + 1:<5} "
            f"{(item_v1['protocol_id'] if item_v1 else ''):<20} "
            f"{(item_v1['similarity_score'] if item_v1 else ''):<10} "
            f"{(item_v2['protocol_id'] if item_v2 else ''):<20} "
            f"{(item_v2['similarity_score'] if item_v2 else ''):<10}"
        )


def run_queries(engine_v1, engine_v2, queries: List[str], top_k: int):
    for query in queries:
        results_v1 = engine_v1.search_similar_protocols(query=query, therapeutic_areas=None, top_k=top_k)
        results_v2 = engine_v2.search_similar_protocols(query=query, therapeutic_areas=None, top_k=top_k)
        metrics = compare_results(results_v1, results_v2)
        print_comparison(query, results_v1, results_v2, metrics)


def main() -> None:
    parser = argparse.ArgumentParser(description="Compare similarity engine v1 and v2 results.")
    parser.add_argument("query", nargs="*", help="Optional query phrases to test.")
    parser.add_argument("--top_k", type=int, default=10, help="Number of top results to compare.")
    args = parser.parse_args()

    protocol_service, engine_v1, engine_v2 = load_engines()

    queries = args.query or [
        "nsclc egfr metastatic phase ii",
        "oncology immunotherapy advanced lung cancer",
        "cardiovascular heart failure phase iii",
        "metastatic breast cancer phase ii",
    ]

    try:
        run_queries(engine_v1, engine_v2, queries, args.top_k)
    except Exception as exc:
        print(f"Error running similarity engine comparison: {exc}")
        raise


if __name__ == "__main__":
    main()
