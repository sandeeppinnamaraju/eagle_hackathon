from app.similarity_engine import search_similar_protocols

query = """

Phase II NSCLC study investigating EGFR resistant
metastatic lung cancer patients with inclusion criteria
focused on adults with advanced disease and prior
TKI treatment failure.

"""

results = search_similar_protocols(
    query=query,
    therapeutic_area="Oncology",
    top_k=5
)

print("\n====================================")
print("SIMILAR PROTOCOL RESULTS")
print("====================================\n")

for idx, result in enumerate(results):

    protocol = result["protocol"]

    print(f"RANK #{idx + 1}")

    print(
        f"Similarity Score: "
        f"{result['similarity_score']}%"
    )

    print(f"Protocol ID: {protocol['protocol_id']}")

    print(f"Title: {protocol['title']}")

    print(f"Phase: {protocol['phase']}")

    print(
        f"Therapeutic Area: "
        f"{protocol['therapeutic_area']}"
    )

    print(f"Indication: {protocol['indication']}")

    print("\n----------------------------------\n")