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

try:
    cur.execute("""
        ALTER TABLE enrollment_rate
        ADD CONSTRAINT enrollment_rate_pkey PRIMARY KEY (id);
    """)
    conn.commit()
    print("Primary key added to enrollment_rate.id")
except Exception as e:
    print(f"Error: {e}")
    conn.rollback()

cur.close()
conn.close()
