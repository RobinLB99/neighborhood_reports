import { pgTable, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { barrios } from "../../../territory/infrastructure/database/schema.js";
import { usuarios } from "../../../authentication/infrastructure/database/schema.js";

export const comites = pgTable("comites", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  barrioId: integer("barrio_id")
    .notNull()
    .unique()
    .references(() => barrios.id, { onDelete: "restrict" }),
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
});

export const miembrosComite = pgTable("miembros_comite", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  comiteId: integer("comite_id")
    .notNull()
    .references(() => comites.id, { onDelete: "cascade" }),
  usuarioId: integer("usuario_id")
    .notNull()
    .unique()
    .references(() => usuarios.id, { onDelete: "restrict" }),
  rol: varchar("rol").notNull(), // 'Presidente', 'Secretario', 'Vocal'
  fechaRegistro: timestamp("fecha_registro").defaultNow(),
});
