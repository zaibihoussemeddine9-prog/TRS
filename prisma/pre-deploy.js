const { execSync } = require("child_process");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("ERROR: DATABASE_URL is not set!");
    process.exit(1);
  }

  console.log("Pre-deploy: DATABASE_URL found ✓");

  // Step 1: Prisma db push (sync schema, accept data loss for column changes)
  console.log("Step 1: Running prisma db push...");
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

  // Step 2: Seed (idempotent — only creates missing data)
  console.log("Step 2: Running seed...");
  try {
    execSync("npx tsx prisma/seed.ts", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: url },
    });
  } catch (err) {
    console.error("  Seed failed:", err.message);
  }

  console.log("Pre-deploy complete ✓");
}

main().catch((e) => { console.error(e); process.exit(1); });
