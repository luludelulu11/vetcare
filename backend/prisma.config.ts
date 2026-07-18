import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // A real DATABASE_URL is required for `prisma migrate`/`db` commands and
    // is provided by the backend host (Railway) as an env var. `prisma
    // generate` never connects, so fall back to a placeholder when the var
    // is absent — otherwise loading this config throws during the frontend
    // build (Vercel), which has no DATABASE_URL and doesn't need one.
    url:
      process.env.DATABASE_URL ??
      "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
