from sqlalchemy import text
from app.database import engine

print("\n===================================")
print("PROTOCOL SITES SAMPLE")
print("===================================\n")

query = text("""

    SELECT *

    FROM protocol_sites

    LIMIT 5

""")

with engine.connect() as connection:

    result = connection.execute(query)

    rows = result.fetchall()

    columns = result.keys()

    print("COLUMNS:\n")

    for column in columns:

        print(column)

    print("\n===================================\n")

    print("ROWS:\n")

    for row in rows:

        print(row)

        print("\n---------------------------\n")