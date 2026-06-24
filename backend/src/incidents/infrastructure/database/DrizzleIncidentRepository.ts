import { db } from "../../../shared-kernel/database/drizzle.js";
import { Reporte, type ReportStatus } from "../../domain/entities/Reporte.js";
import type { IncidentRepository } from "../../domain/repositories/IncidentRepository.interface.js";
import { reportes } from "./schema.js";

/**
 * Adaptador de Persistencia (Driven Adapter) para Drizzle ORM.
 * 
 * Implementa el puerto IncidentRepository para interactuar con la tabla
 * 'reportes' en la base de datos PostgreSQL de Neon.
 */
export class DrizzleIncidentRepository implements IncidentRepository {
  /**
   * Inserta un nuevo reporte en la base de datos utilizando Drizzle ORM.
   * 
   * @param report Entidad de dominio Reporte que contiene los datos a insertar.
   * @returns La nueva entidad de dominio Reporte con sus campos generados por la base de datos (id, fechas).
   * @throws Error si ocurre un fallo al insertar en la persistencia.
   */
  async createReport(report: Reporte): Promise<Reporte> {
    try {
      const [inserted] = await db
        .insert(reportes)
        .values({
          usuarioId: report.usuarioId,
          barrioId: report.barrioId,
          direccion: report.direccion,
          ubicacion: report.ubicacion,
          fotoUrl: report.fotoUrl,
          estado: report.estado,
          descripcion: report.descripcion,
        })
        .returning();

      if (!inserted) {
        throw new Error("No se devolvieron filas tras realizar la inserción.");
      }

      return new Reporte(
        inserted.id,
        inserted.usuarioId,
        inserted.barrioId,
        inserted.direccion,
        inserted.ubicacion,
        inserted.fotoUrl,
        inserted.estado as ReportStatus,
        inserted.descripcion,
        inserted.activo ?? undefined,
        inserted.fechaCreacion ?? undefined,
        inserted.fechaActualizacion ?? undefined
      );
    } catch (error: any) {
      console.error("[Database Error] Error al persistir reporte:", error);
      throw new Error(`[Database Infrastructure Error]: ${error.message || "Fallo de persistencia desconocido."}`);
    }
  }
}
