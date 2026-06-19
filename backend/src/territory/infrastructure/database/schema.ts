import { pgTable, integer, varchar, timestamp } from "drizzle-orm/pg-core";

export const provincias = pgTable("provincias", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  nombre: varchar("nombre").notNull(),
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
});

export const ciudades = pgTable("ciudades", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  provinciaId: integer("provincia_id")
    .notNull()
    .references(() => provincias.id, { onDelete: "restrict" }),
  nombre: varchar("nombre").notNull(),
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
});

export const barrios = pgTable("barrios", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  ciudadId: integer("ciudad_id")
    .notNull()
    .references(() => ciudades.id, { onDelete: "restrict" }),
  nombre: varchar("nombre").notNull(),
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
});
