from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from eagle_hackathon.apps.backend.services.protocol_service import get_protocols


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

    tfidf_matrix = vectorizer.fit_transform(
        corpus
    )

    return protocols, vectorizer, tfidf_matrix


# =========================================
# GET MATCH LABEL
# =========================================


def get_match_label(score):

    if score >= 70:

        return "High match"

    elif score >= 40:

        return "Moderate match"

    else:

        return "Low match"


# =========================================
# BUILD PREVIEW BULLETS
# =========================================


def build_preview_list(text):

    if not text:

        return []

    lines = text.split("\n")

    cleaned = []

    for line in lines:

        line = line.strip()

        if len(line) > 10:

            cleaned.append(line)

    return cleaned[:2]


# =========================================
# SEARCH SIMILAR PROTOCOLS
# =========================================


def search_similar_protocols(

    query,

    therapeutic_areas=None,

    top_k=10

):

    protocols, vectorizer, tfidf_matrix = (
        create_search_model()
    )

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
    # CALCULATE SIMILARITY
    # =====================================

    similarity_scores = cosine_similarity(

        query_vector,

        tfidf_matrix

    )[0]

    ranked_results = []

    # =====================================
    # PROCESS RESULTS
    # =====================================

    for idx, score in enumerate(
        similarity_scores
    ):

        protocol = protocols[idx]

        # =================================
        # MULTI-SELECT THERAPEUTIC FILTER
        # =================================

        if therapeutic_areas:

            if (
                protocol["therapeutic_area"]
                not in therapeutic_areas
            ):

                continue

        # =================================
        # MANUAL DOMAIN BOOSTS
        # =================================

        bonus = 0

        title_text = str(
            protocol["title"]
        ).lower()

        indication_text = str(
            protocol["indication"]
        ).lower()

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

        # =================================
        # FINAL SCORE
        # =================================

        final_score = round(
            float((score + bonus) * 100),
            2
        )

        # =================================
        # FRONTEND-READY RESULT
        # =================================

        result = {

            "rank": 0,

            "protocol_id": protocol[
                "protocol_id"
            ],

            "title": protocol[
                "title"
            ],

            "phase": protocol[
                "phase"
            ],

            "therapeutic_area": protocol[
                "therapeutic_area"
            ],

            "indication": protocol[
                "indication"
            ],

            "similarity_score": final_score,

            "match_label": get_match_label(
                final_score
            ),

            "inclusion_preview": (
                build_preview_list(
                    protocol[
                        "inclusion_criteria"
                    ]
                )
            ),

            "exclusion_preview": (
                build_preview_list(
                    protocol[
                        "exclusion_criteria"
                    ]
                )
            ),

            # FULL PROTOCOL OBJECT
            # FOR DETAILS PAGE
            "protocol": protocol

        }

        ranked_results.append(result)

    # =====================================
    # SORT RESULTS
    # =====================================

    ranked_results = sorted(

        ranked_results,

        key=lambda x: x[
            "similarity_score"
        ],

        reverse=True

    )

    # =====================================
    # ADD RANKING
    # =====================================

    for idx, result in enumerate(
        ranked_results
    ):

        result["rank"] = idx + 1

    # =====================================
    # RETURN TOP RESULTS
    # =====================================

    return ranked_results[:top_k]
