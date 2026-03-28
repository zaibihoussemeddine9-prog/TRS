// Pre-deploy script: clean up legacy enum columns before prisma db push
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Pre-deploy: cleaning legacy data...");

  try {
    // 1. Convert role column to plain text to avoid enum conversion errors
    const colCheck = await client.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'User' AND column_name = 'role'
    `);

    if (colCheck.rows.length > 0 && colCheck.rows[0].data_type === 'USER-DEFINED') {
      console.log("Converting role column from enum to text...");
      await client.query(`ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT`);
      console.log("Role column converted to text.");
    }

    // 2. Normalize any legacy role values
    await client.query(`
      UPDATE "User" SET "role" = 'ADMIN'
      WHERE "role" NOT IN ('ADMIN', 'RESPONSABLE', 'OPERATEUR', 'LECTURE_SEULE')
    `);
    console.log("Legacy role values normalized.");

    // 3. Drop any leftover enum types
    const enums = await client.query(`
      SELECT typname FROM pg_type
      WHERE typname LIKE 'UserRole%' OR typname LIKE '%UserRole%'
    `);
    for (const row of enums.rows) {
      console.log(`Dropping enum type: ${row.typname}`);
      await client.query(`DROP TYPE IF EXISTS "${row.typname}" CASCADE`);
    }
    console.log("Legacy enums cleaned.");

    // 4. Drop old tables that no longer exist in the schema
    const oldTables = [
      'ActionPlan', 'KPIThreshold', 'ProductionEntry', 'DowntimeEntry',
      'DowntimeSubCause', 'DowntimeCause', 'Format', 'ProductLineConfig',
      'PackagingLine', 'Shift', 'Team', 'Workshop', 'Site'
    ];
    for (const table of oldTables) {
      await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    }
    console.log("Old tables dropped.");

    // 5. Drop ALL old enum types
    const allEnums = await client.query(`
      SELECT typname FROM pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public' AND t.typtype = 'e'
    `);
    for (const row of allEnums.rows) {
      console.log(`Dropping enum: ${row.typname}`);
      await client.query(`DROP TYPE IF EXISTS "${row.typname}" CASCADE`);
    }
    console.log("All enums cleaned.");

  } catch (err) {
    console.error("Pre-deploy cleanup error:", err.message);
    // Don't fail — let db push handle whatever is left
  } finally {
    await client.end();
  }
  console.log("Pre-deploy cleanup done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
