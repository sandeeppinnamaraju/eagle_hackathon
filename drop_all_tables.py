import psycopg2

conn = psycopg2.connect(
    host='eagle-postgre-poc.postgres.database.azure.com',
    user='eagle_admin',
    port=5432,
    database='postgres',
    password='FD_hack@357',
    sslmode='require'
)
conn.autocommit = False
cur = conn.cursor()

cur.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")
tables = [r[0] for r in cur.fetchall()]

print(f"Dropping {len(tables)} tables...")
for t in tables:
    cur.execute(f'DROP TABLE IF EXISTS public."{t}" CASCADE')
    print(f"  Dropped: {t}")

conn.commit()
cur.close()
conn.close()
print("Done. All tables dropped.")
