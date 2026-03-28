const { Client } = require("pg");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.log("No DATABASE_URL, skipping pre-deploy."); return; }

  const client = new Client({ connectionString: url });
  await client.connect();
  console.log("Pre-deploy: resetting database...");

  try {
    // Drop everything in public schema
    await client.query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO public;
    `);
    console.log("Schema reset complete.");
  } catch (err) {
    console.error("Pre-deploy error:", err.message);
  } finally {
    await client.end();
  }
  console.log("Pre-deploy done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
