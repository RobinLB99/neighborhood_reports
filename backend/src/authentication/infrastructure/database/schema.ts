import { pgTable, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { barrios } from "../../../territory/infrastructure/database/schema.js";

export const usuarios = pgTable("usuarios", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  barrioId: integer("barrio_id")
    .notNull()
    .references(() => barrios.id, { onDelete: "restrict" }),
  nombre: varchar("nombre").notNull(),
  usuario: varchar("usuario").unique().notNull(),
  contrasenaHash: varchar("contrasena_hash").notNull(),
  rol: varchar("rol").default("Vecino"),
  fechaRegistro: timestamp("fecha_registro").defaultNow(),
});
