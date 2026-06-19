import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Asegúrate de usar la URL de conexión directa que te da Vercel
const sql = neon(process.env.DATABASE_URL!);

// Instancia de Drizzle optimizada para HTTP Serverless
export const db = drizzle(sql);
