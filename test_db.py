print("STARTING TEST...")

from app.database import engine
from sqlalchemy import text

print("IMPORTS SUCCESSFUL")

try:

    print("TRYING CONNECTION...")

    with engine.connect() as connection:

        print("CONNECTED!")

        result = connection.execute(
            text("SELECT version();")
        )

        version = result.fetchone()

        print("\nCONNECTED SUCCESSFULLY!\n")

        print(version[0])

except Exception as e:

    print("\nDATABASE CONNECTION FAILED\n")

    print(e)