import { pgTable, integer, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { barrios } from "../../../territory/infrastructure/database/schema.js";

export const userRoleEnum = pgEnum("user_role", ["lider", "miembro", "ciudadano"]);

export const usuarios = pgTable("usuarios", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  barrioId: integer("barrio_id")
    .notNull()
    .references(() => barrios.id, { onDelete: "restrict" }),
  nombre: varchar("nombre").notNull(),
  usuario: varchar("usuario").unique().notNull(),
  contrasenaHash: varchar("contrasena_hash").notNull(),
  rol: userRoleEnum("rol").notNull().default("ciudadano"),
  fechaRegistro: timestamp("fecha_registro").defaultNow(),
});


