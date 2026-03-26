import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log("Tables in database:", tablesRes.rows.map(r => r.table_name));

    const tablesToCheck = ['menu_items', 'variation_options', 'variation_groups', 'categories'];
    for (const table of tablesToCheck) {
      const colRes = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}'`);
      console.log(`Columns in ${table}:`, colRes.rows.map(r => r.column_name));
    }
  } catch (err) {
    console.error("Database connection error:", err.message);
  } finally {
    await pool.end();
  }
}

check();
