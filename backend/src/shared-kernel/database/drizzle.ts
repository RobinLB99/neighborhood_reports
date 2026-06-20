import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Configuración para desarrollo local usando el proxy de Docker (neon_local)
if (process.env.NODE_ENV === "development") {
  neonConfig.fetchEndpoint = "http://localhost:5432/sql";
  neonConfig.useSecureWebSocket = false;
}

// Asegúrate de usar la URL de conexión directa que te da Vercel
const sql = neon(process.env.DATABASE_URL!);

// Instancia de Drizzle optimizada para HTTP Serverless
export const db = drizzle(sql);

