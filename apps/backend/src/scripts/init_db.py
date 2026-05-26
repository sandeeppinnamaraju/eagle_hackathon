import json
from typing import List

from eagle_hackathon.apps.backend.src.db.connection import get_conn_params
import psycopg2


REQUIRED_TABLES: List[str] = [
    "studies",
    "protocols",
]


def run_db_init_check() -> dict:
    conn_params = get_conn_params()
    missing_tables: List[str] = []

    with psycopg2.connect(**conn_params) as conn:
        with conn.cursor() as cursor:
            for table_name in REQUIRED_TABLES:
                cursor.execute(
                    """
                    SELECT EXISTS (
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_schema = 'public' AND table_name = %s
                    )
                    """,
                    (table_name,),
                )
                exists = cursor.fetchone()[0]
                if not exists:
                    missing_tables.append(table_name)

    return {
        "ok": len(missing_tables) == 0,
        "missing_tables": missing_tables,
        "checked_tables": REQUIRED_TABLES,
    }


if __name__ == "__main__":
    print(json.dumps(run_db_init_check(), indent=2))
