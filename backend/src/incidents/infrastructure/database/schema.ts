import { pgTable, integer, varchar, timestamp, text, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { usuarios } from "../../../authentication/infrastructure/database/schema.js";
import { barrios } from "../../../territory/infrastructure/database/schema.js";

export const reportes = pgTable("reportes", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  usuarioId: integer("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "restrict" }),
  barrioId: integer("barrio_id")
    .notNull()
    .references(() => barrios.id, { onDelete: "restrict" }),
  direccion: varchar("direccion").notNull(),
  ubicacion: varchar("ubicacion").notNull(), // Coordenadas X/Y en el mapa
  fotoUrl: varchar("foto_url").notNull(),
  estado: varchar("estado").default("Pendiente"), // Pendiente, En_proceso, Resuelto
  descripcion: text("descripcion").notNull(),
  activo: boolean("activo").default(true), // Borrado lógico
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
  fechaActualizacion: timestamp("fecha_actualizacion").defaultNow(),
});

export const gestionesDirectiva = pgTable("gestiones_directiva", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  reporteId: integer("reporte_id")
    .notNull()
    .references(() => reportes.id, { onDelete: "cascade" }),
  liderId: integer("lider_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "restrict" }),
  estadoAsignado: varchar("estado_asignado").notNull(), // El estado definido en este paso (ej. En_proceso)
  mensaje: text("mensaje").notNull(),
  fechaGestion: timestamp("fecha_gestion").defaultNow(),
});

export const comentarios = pgTable("comentarios", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  reporteId: integer("reporte_id")
    .notNull()
    .references(() => reportes.id, { onDelete: "cascade" }),
  usuarioId: integer("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "restrict" }),
  mensaje: text("mensaje").notNull(),
  activo: boolean("activo").default(true),
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
});

export const apoyos = pgTable(
  "apoyos",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "restrict" }),
    reporteId: integer("reporte_id")
      .notNull()
      .references(() => reportes.id, { onDelete: "cascade" }),
    fecha: timestamp("fecha").defaultNow(),
  },
  (table) => ({
    // Evita que un mismo usuario apoye varias veces la misma incidencia
    usuarioReporteUniqueIdx: uniqueIndex("apoyos_usuario_id_reporte_id_idx").on(table.usuarioId, table.reporteId),
  })
);
