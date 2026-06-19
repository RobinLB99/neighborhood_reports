import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // Busca cualquier archivo schema.ts dentro de la infraestructura de tus dominios
  schema: "./src/**/infrastructure/database/schema.ts",
  // Dónde se guardarán los archivos históricos de migraciones SQL (zona neutra local)
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Buenas prácticas para producción
  verbose: true,
  strict: true,
});
