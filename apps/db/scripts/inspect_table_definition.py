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

cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enrollment_rate' ORDER BY ordinal_position")
cols = cur.fetchall()
print('enrollment_rate columns:')
for name, dtype in cols:
    print(f'  {name}: {dtype}')

cur.execute("SELECT constraint_type, constraint_name FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'enrollment_rate'")
print('\nConstraints:')
for row in cur.fetchall():
    print(row)

cur.close()
conn.close()
