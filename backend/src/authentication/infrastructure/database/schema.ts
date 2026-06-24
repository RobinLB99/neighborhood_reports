import { pgTable, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { barrios } from "../../../territory/infrastructure/database/schema.js";

export const roles = pgTable("roles", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  nombre: varchar("nombre").unique().notNull(),
});

export const usuarios = pgTable("usuarios", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  barrioId: integer("barrio_id")
    .notNull()
    .references(() => barrios.id, { onDelete: "restrict" }),
  nombre: varchar("nombre").notNull(),
  usuario: varchar("usuario").unique().notNull(),
  contrasenaHash: varchar("contrasena_hash").notNull(),
  rolId: integer("rol_id")
    .notNull()
    .references(() => roles.id, { onDelete: "restrict" }),
  fechaRegistro: timestamp("fecha_registro").defaultNow(),
});

