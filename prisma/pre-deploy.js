// Pre-deploy script: clean ALL data and legacy structures before db push
// This runs BEFORE prisma db push and BEFORE seed
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Pre-deploy: cleaning database...");

  try {
    // 1. Drop ALL tables (clean slate for db push)
    const tables = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      AND tablename != '_prisma_migrations'
    `);

    if (tables.rows.length > 0) {
      // Disable FK checks and drop everything
      const tableNames = tables.rows.map(r => `"${r.tablename}"`).join(", ");
      await client.query(`DROP TABLE IF EXISTS ${tableNames} CASCADE`);
      console.log(`Dropped ${tables.rows.length} tables.`);
    }

    // 2. Drop ALL enum types
    const enums = await client.query(`
      SELECT typname FROM pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public' AND t.typtype = 'e'
    `);
    for (const row of enums.rows) {
      await client.query(`DROP TYPE IF EXISTS "${row.typname}" CASCADE`);
    }
    if (enums.rows.length > 0) console.log(`Dropped ${enums.rows.length} enum types.`);

  } catch (err) {
    console.error("Pre-deploy error:", err.message);
  } finally {
    await client.end();
  }
  console.log("Pre-deploy done — clean slate for db push.");
}

main().catch((e) => { console.error(e); process.exit(1); });
