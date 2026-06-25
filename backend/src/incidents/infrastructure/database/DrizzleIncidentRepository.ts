import { eq, and, inArray, desc } from "drizzle-orm";
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

  /**
   * Obtiene la lista de reportes de un barrio utilizando Drizzle ORM, opcionalmente filtrados por estado.
   * 
   * @param barrioId ID del barrio de donde se desean consultar los reportes.
   * @param estado Estado opcional por el cual filtrar (si es 'todos'/'all' o indefinido, trae todos los activos).
   * @returns Listado de entidades de dominio Reporte.
   * @throws Error si ocurre un fallo al consultar en la persistencia.
   */
  async listReportsByBarrio(barrioId: number, estado?: string): Promise<Reporte[]> {
    try {
      const statusFilter =
        estado && estado !== "todos" && estado !== "all"
          ? eq(reportes.estado, estado)
          : inArray(reportes.estado, ["pendiente", "en_gestion", "solucionado"]);

      const records = await db
        .select()
        .from(reportes)
        .where(
          and(
            eq(reportes.barrioId, barrioId),
            statusFilter,
            eq(reportes.activo, true)
          )
        )
        .orderBy(desc(reportes.fechaCreacion));

      return records.map(
        (row) =>
          new Reporte(
            row.id,
            row.usuarioId,
            row.barrioId,
            row.direccion,
            row.ubicacion,
            row.fotoUrl,
            row.estado as ReportStatus,
            row.descripcion,
            row.activo ?? undefined,
            row.fechaCreacion ?? undefined,
            row.fechaActualizacion ?? undefined
          )
      );
    } catch (error: any) {
      console.error("[Database Error] Error al listar reportes activos:", error);
      throw new Error(`[Database Infrastructure Error]: ${error.message || "Fallo de consulta desconocido."}`);
    }
  }

  /**
   * Busca un reporte activo por su ID en la base de datos utilizando Drizzle ORM.
   * 
   * @param id ID del reporte a buscar.
   * @returns La entidad de dominio Reporte o null si no se encuentra.
   * @throws Error si ocurre un fallo al consultar en la persistencia.
   */
  async findById(id: number): Promise<Reporte | null> {
    try {
      const [row] = await db
        .select()
        .from(reportes)
        .where(and(eq(reportes.id, id), eq(reportes.activo, true)))
        .limit(1);

      if (!row) {
        return null;
      }

      return new Reporte(
        row.id,
        row.usuarioId,
        row.barrioId,
        row.direccion,
        row.ubicacion,
        row.fotoUrl,
        row.estado as any,
        row.descripcion,
        row.activo ?? undefined,
        row.fechaCreacion ?? undefined,
        row.fechaActualizacion ?? undefined
      );
    } catch (error: any) {
      console.error("[Database Error] Error al buscar reporte por ID:", error);
      throw new Error(`[Database Infrastructure Error]: ${error.message || "Fallo de consulta por ID desconocido."}`);
    }
  }

  /**
   * Realiza la eliminación lógica de un reporte actualizando el campo 'activo' a false.
   * 
   * @param id ID del reporte a eliminar lógicamente.
   */
  async softDelete(id: number): Promise<void> {
    try {
      await db
        .update(reportes)
        .set({
          activo: false,
          fechaActualizacion: new Date(),
        })
        .where(eq(reportes.id, id));
    } catch (error: any) {
      console.error("[Database Error] Error al realizar borrado lógico de reporte:", error);
      throw new Error(`[Database Infrastructure Error]: ${error.message || "Fallo al ejecutar eliminación lógica."}`);
    }
  }
}

