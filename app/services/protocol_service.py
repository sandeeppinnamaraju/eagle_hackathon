from sqlalchemy import text
from app.database import engine


def get_protocols():

    query = text("""
        SELECT *
        FROM protocols
        LIMIT 5
    """)

    with engine.connect() as connection:

        result = connection.execute(query)

        rows = result.fetchall()

        columns = result.keys()

        return rows, columns



# =========================================
# GET PROTOCOL BY ID
# =========================================

def get_protocol_by_id(protocol_id):

    query = text("""

        SELECT *

        FROM protocols

        WHERE protocol_id = :protocol_id

    """)

    with engine.connect() as connection:

        result = connection.execute(
            query,
            {
                "protocol_id": protocol_id
            }
        )

        row = result.fetchone()

        if not row:

            return None

        columns = result.keys()

        protocol = dict(zip(columns, row))

        return protocol


        # =========================================
# GET PROTOCOL SITES
# =========================================

def get_protocol_sites(protocol_id):

    query = text("""

        SELECT *

        FROM protocol_sites

        WHERE protocol_id = :protocol_id

    """)

    with engine.connect() as connection:

        result = connection.execute(
            query,
            {
                "protocol_id": protocol_id
            }
        )

        rows = result.fetchall()

        columns = result.keys()

        sites = []

        for row in rows:

            site = dict(zip(columns, row))

            sites.append(site)

        return sites