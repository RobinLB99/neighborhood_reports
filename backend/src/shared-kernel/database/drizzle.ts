import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

// Configuración del pool de conexiones usando el driver estándar TCP 'pg'
// Esto nos garantiza soporte completo de transacciones interactivas,
// compatibilidad con PgBouncer (local y producción) y elimina problemas de certificados SSL locales.
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Exportar la instancia de Drizzle optimizada para TCP y transacciones
export const db = drizzle(pool);
