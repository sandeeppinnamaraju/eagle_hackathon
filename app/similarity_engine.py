from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.services.protocol_service import get_protocols

# =========================================
# BUILD SEARCHABLE PROTOCOL DOCUMENTS
# =========================================

def build_protocol_documents():

    rows, columns = get_protocols()

    protocols = []

    corpus = []

    for row in rows:

        protocol = {
            "protocol_id": row[0],
            "title": row[1],
            "phase": row[2],
            "therapeutic_area": row[3],
            "indication": row[4],
            "full_summary": row[5],
            "inclusion_criteria": row[6],
            "exclusion_criteria": row[7],
            "target_enrollment": row[8],
            "actual_enrollment": row[9],
            "planned_start_date": row[10],
            "actual_end_date": row[11],
            "planned_duration_months": row[12],
            "actual_duration_months": row[13],
            "lessons_learned": row[14]
        }

        # =====================================
        # WEIGHTED SEARCH TEXT
        # =====================================

        combined_text = f"""

        {protocol["title"]} {protocol["title"]} {protocol["title"]}

        {protocol["therapeutic_area"]} {protocol["therapeutic_area"]}

        {protocol["indication"]} {protocol["indication"]}

        {protocol["full_summary"]}

        {protocol["inclusion_criteria"]}

        {protocol["exclusion_criteria"]}

        {protocol["lessons_learned"]}

        """

        protocols.append(protocol)

        corpus.append(combined_text)

    return protocols, corpus

# =========================================
# CREATE TF-IDF MODEL
# =========================================

def create_search_model():

    protocols, corpus = build_protocol_documents()

    vectorizer = TfidfVectorizer(
        stop_words="english",
        lowercase=True,
        ngram_range=(1, 2),
        max_features=15000
    )

    tfidf_matrix = vectorizer.fit_transform(corpus)

    return protocols, vectorizer, tfidf_matrix

# =========================================
# SEARCH SIMILAR PROTOCOLS
# =========================================

def search_similar_protocols(
    query,
    therapeutic_area=None,
    top_k=10
):

    protocols, vectorizer, tfidf_matrix = create_search_model()

    # =====================================
    # BOOST IMPORTANT QUERY TERMS
    # =====================================

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

    """

    # =====================================
    # VECTORIZE QUERY
    # =====================================

    query_vector = vectorizer.transform(
        [boosted_query]
    )

    # =====================================
    # CALCULATE COSINE SIMILARITY
    # =====================================

    similarity_scores = cosine_similarity(
        query_vector,
        tfidf_matrix
    )[0]

    ranked_results = []

    for idx, score in enumerate(similarity_scores):

        protocol = protocols[idx]

        # =================================
        # THERAPEUTIC FILTER
        # =================================

        if therapeutic_area:

            if (
                protocol["therapeutic_area"]
                != therapeutic_area
            ):
                continue

        # =================================
        # MANUAL DOMAIN BOOSTS
        # =================================

        bonus = 0

        title_text = (
            str(protocol["title"]).lower()
        )

        indication_text = (
            str(protocol["indication"]).lower()
        )

        query_text = query.lower()

        # NSCLC boost

        if (
            "nsclc" in query_text
            and "nsclc" in indication_text
        ):
            bonus += 0.10

        # EGFR boost

        if (
            "egfr" in query_text
            and "egfr" in title_text
        ):
            bonus += 0.15

        # metastatic boost

        if (
            "metastatic" in query_text
            and "metastatic" in title_text
        ):
            bonus += 0.08

        # Phase II boost

        if (
            "phase ii" in query_text
            and protocol["phase"] == "PHASE_II"
        ):
            bonus += 0.05

        final_score = score + bonus

        ranked_results.append({
            "similarity_score": round(
                float(final_score * 100),
                2
            ),
            "protocol": protocol
        })

    # =====================================
    # SORT RESULTS
    # =====================================

    ranked_results = sorted(
        ranked_results,
        key=lambda x: x["similarity_score"],
        reverse=True
    )

    return ranked_results[:top_k]