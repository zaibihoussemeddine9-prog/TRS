const { execSync } = require("child_process");

async function main() {
  // Try multiple Railway PostgreSQL variable names
  const url = process.env.DATABASE_URL
    || process.env.DATABASE_PRIVATE_URL
    || process.env.DATABASE_PUBLIC_URL
    || process.env.POSTGRES_URL
    || process.env.POSTGRES_PRIVATE_URL
    || process.env.POSTGRES_PUBLIC_URL;

  if (!url) {
    console.error("ERROR: No database URL found!");
    console.error("Checked: DATABASE_URL, DATABASE_PRIVATE_URL, DATABASE_PUBLIC_URL, POSTGRES_URL, POSTGRES_PRIVATE_URL, POSTGRES_PUBLIC_URL");
    console.error("Available env vars:", Object.keys(process.env).filter(k => k.includes("DATA") || k.includes("POSTGRES") || k.includes("PG")).join(", ") || "none found");
    process.exit(1);
  }

  // Log which variable was found (masked)
  const masked = url.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
  console.log(`Pre-deploy: Using database URL: ${masked}`);

  // Check for localhost (wrong config)
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    console.error("WARNING: DATABASE_URL points to localhost!");
    console.error("On Railway, this should be a remote URL like postgresql://...@monorail.proxy.rlwy.net:XXXXX/railway");
    console.error("Please update DATABASE_URL in Railway Variables to reference your PostgreSQL service.");
    // Don't exit — try anyway in case it's intentional
  }

  // Set DATABASE_URL for child processes (in case it was found under a different name)
  const env = { ...process.env, DATABASE_URL: url };

  // Step 1: Prisma db push
  console.log("Step 1: Running prisma db push...");
  try {
    execSync("npx prisma db push --accept-data-loss --skip-generate", { stdio: "inherit", env });
    console.log("  db push complete.");
  } catch (err) {
    console.error("  db push failed:", err.message);
    process.exit(1);
  }

  // Step 2: Seed
  console.log("Step 2: Running seed...");
  try {
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env });
  } catch (err) {
    console.error("  Seed failed:", err.message);
  }

  console.log("Pre-deploy complete ✓");
}

main().catch((e) => { console.error(e); process.exit(1); });
