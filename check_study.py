import psycopg2

conn = psycopg2.connect(
    host='eagle-postgre-poc.postgres.database.azure.com',
    user='eagle_admin',
    port=5432,
    database='postgres',
    password='FD_hack@357',
    sslmode='require'
)
cur = conn.cursor()

tables = ['studies', 'enrollment_timeline', 'enrollment_rate', 'kpi_snapshot', 'kpi_timeline',
          'country_breakdown', 'site_breakdown', 'performance_drivers', 'site_detail',
          'protocols', 'protocol_sites', 'lessons_learned', 'users']

for t in tables:
    try:
        cur.execute(f"SELECT COUNT(*) FROM public.{t}")
        print(f"{t}: {cur.fetchone()[0]} rows")
    except Exception as e:
        print(f"{t}: ERROR - {e}")
        conn.rollback()

print("\nDone.")

cur.close()
conn.close()
