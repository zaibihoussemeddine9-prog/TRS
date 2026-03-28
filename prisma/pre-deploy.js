const { execSync } = require("child_process");

async function main() {
  // Try multiple Railway PostgreSQL variable names
  let url = process.env.DATABASE_URL
    || process.env.DATABASE_PRIVATE_URL
    || process.env.DATABASE_PUBLIC_URL
    || process.env.POSTGRES_URL
    || process.env.POSTGRES_PRIVATE_URL
    || process.env.POSTGRES_PUBLIC_URL;

  if (!url) {
    console.error("╔══════════════════════════════════════════════════════════╗");
    console.error("║  ERROR: Aucune variable DATABASE_URL trouvée !          ║");
    console.error("║                                                        ║");
    console.error("║  Dans Railway dashboard :                              ║");
    console.error("║  1. Clique sur ton service PostgreSQL                  ║");
    console.error("║  2. Onglet 'Variables' → copie DATABASE_URL            ║");
    console.error("║  3. Va dans ton service TRS → 'Variables'              ║");
    console.error("║  4. Ajoute DATABASE_URL avec la valeur copiée          ║");
    console.error("║     Ou tape: ${{Postgres.DATABASE_URL}}                ║");
    console.error("╚══════════════════════════════════════════════════════════╝");
    console.error("");
    console.error("Variables disponibles:", Object.keys(process.env).filter(k =>
      k.includes("DATA") || k.includes("POSTGRES") || k.includes("PG") || k.includes("RAILWAY")
    ).join(", ") || "aucune liée à la base");
    process.exit(1);
  }

  // BLOCK localhost in production
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    console.error("╔══════════════════════════════════════════════════════════╗");
    console.error("║  ERROR: DATABASE_URL pointe vers localhost !            ║");
    console.error("║                                                        ║");
    console.error("║  URL actuelle: " + url.substring(0, 40) + "...        ║");
    console.error("║                                                        ║");
    console.error("║  SOLUTION dans Railway dashboard :                     ║");
    console.error("║  1. Service TRS → Variables                            ║");
    console.error("║  2. SUPPRIME la variable DATABASE_URL                  ║");
    console.error("║  3. Recrée-la avec la valeur: ${{Postgres.DATABASE_URL}}║");
    console.error("║  4. Redéploie                                          ║");
    console.error("╚══════════════════════════════════════════════════════════╝");
    process.exit(1);
  }

  // Log masked URL
  const masked = url.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
  console.log(`Pre-deploy: DB = ${masked}`);

  // Step 1: Prisma db push
  console.log("Step 1: prisma db push...");
  try {
    execSync("npx prisma db push --accept-data-loss --skip-generate", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: url },
    });
  } catch (err) {
    console.error("db push failed:", err.message);
    process.exit(1);
  }

  // Step 2: Seed
  console.log("Step 2: seed...");
  try {
    execSync("npx tsx prisma/seed.ts", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: url },
    });
  } catch (err) {
    console.error("Seed failed (non-blocking):", err.message);
  }

  console.log("Pre-deploy OK ✓");
}

main().catch((e) => { console.error(e); process.exit(1); });
