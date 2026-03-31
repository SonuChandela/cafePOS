import { pool } from "./db";

async function reset() {
  console.log("Dropping public schema...");
  await pool.query("DROP SCHEMA public CASCADE;");
  
  console.log("Recreating public schema...");
  await pool.query("CREATE SCHEMA public;");
  
  console.log("Granting permissions...");
  await pool.query("GRANT ALL ON SCHEMA public TO public;");
  
  await pool.end();
  console.log("Done.");
}

reset().catch(console.error);
