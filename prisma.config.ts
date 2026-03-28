import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Explicit: uses DATABASE_URL from system env (Railway) or .env (local)
    url: process.env.DATABASE_URL!,
  },
});
