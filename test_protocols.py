from app.services.protocol_service import get_protocols

rows, columns = get_protocols()

print("\n=== PROTOCOL COLUMNS ===\n")

for column in columns:

    print(column)

print("\n=== SAMPLE DATA ===\n")

for row in rows:

    print(row)

    print("\n-------------------------\n")