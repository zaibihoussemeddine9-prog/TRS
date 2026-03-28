const { Client } = require("pg");
const { execSync } = require("child_process");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("ERROR: DATABASE_URL is not set!");
    console.error("Make sure your PostgreSQL service is linked to this Railway service.");
    process.exit(1);
  }

  console.log("Pre-deploy: DATABASE_URL found ✓");

  // Step 1: Reset schema
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log("Step 1: Resetting database schema...");
    await client.query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO public;
    `);
    console.log("  Schema reset complete.");
  } catch (err) {
    console.error("  Schema reset error:", err.message);
  } finally {
    await client.end();
  }

  // Step 2: Prisma db push (pass DATABASE_URL explicitly)
  console.log("Step 2: Running prisma db push...");
  try {
    execSync("npx prisma db push --accept-data-loss --skip-generate", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: url },
    });
    console.log("  db push complete.");
  } catch (err) {
    console.error("  db push failed:", err.message);
    process.exit(1);
  }

  // Step 3: Seed
  console.log("Step 3: Running seed...");
  try {
    execSync("npx tsx prisma/seed.ts", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: url },
    });
  } catch (err) {
    console.error("  Seed failed:", err.message);
    // Don't fail deploy for seed issues
  }

  console.log("Pre-deploy complete ✓");
}

main().catch((e) => { console.error(e); process.exit(1); });
