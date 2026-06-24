import { pgTable, integer, varchar, timestamp, text, boolean, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usuarios } from "../../../authentication/infrastructure/database/schema.js";
import { barrios } from "../../../territory/infrastructure/database/schema.js";
import { REPORT_STATUSES } from "../../domain/entities/Reporte.js";

export const reportes = pgTable(
  "reportes",
  {
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
    estado: varchar("estado").default("pendiente").notNull(), // pendiente, en_gestion, solucionado
    descripcion: text("descripcion").notNull(),
    activo: boolean("activo").default(true), // Borrado lógico
    fechaCreacion: timestamp("fecha_creacion").defaultNow(),
    fechaActualizacion: timestamp("fecha_actualizacion").defaultNow(),
  },
  (table) => ({
    estadoCheck: check("chk_reportes_estado", sql`${table.estado} IN (${sql.raw(REPORT_STATUSES.map(s => `'${s}'`).join(', '))})`),
  })
);

export const gestionesDirectiva = pgTable(
  "gestiones_directiva",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    reporteId: integer("reporte_id")
      .notNull()
      .references(() => reportes.id, { onDelete: "cascade" }),
    liderId: integer("lider_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "restrict" }),
    estadoAsignado: varchar("estado_asignado").notNull(), // El estado definido en este paso (ej. en_gestion)
    mensaje: text("mensaje").notNull(),
    fechaGestion: timestamp("fecha_gestion").defaultNow(),
  },
  (table) => ({
    estadoAsignadoCheck: check(
      "chk_gestiones_estado_asignado",
      sql`${table.estadoAsignado} IN (${sql.raw(REPORT_STATUSES.map(s => `'${s}'`).join(', '))})`
    ),
  })
);

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
