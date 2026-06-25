import { eq, and, desc } from "drizzle-orm";
import { db } from "../../../shared-kernel/database/drizzle.js";
import { Comentario } from "../../domain/entities/Comentario.js";
import type { IncidentCommentRepository } from "../../domain/repositories/IncidentCommentRepository.interface.js";
import { comentarios } from "./schema.js";

/**
 * Adaptador de Persistencia (Driven Adapter) para Drizzle ORM.
 * 
 * Implementa el puerto IncidentCommentRepository para interactuar con la tabla
 * 'comentarios' en la base de datos PostgreSQL de Neon.
 */
export class DrizzleIncidentCommentRepository implements IncidentCommentRepository {
  /**
   * Registra un nuevo comentario en un reporte.
   * 
   * @param comentario Entidad de dominio Comentario a registrar.
   * @returns La entidad de dominio Comentario creada y persistida con su ID asignado.
   * @throws Error si ocurre un fallo al insertar en la persistencia.
   */
  async addComment(comentario: Comentario): Promise<Comentario> {
    try {
      const [inserted] = await db
        .insert(comentarios)
        .values({
          reporteId: comentario.reporteId,
          usuarioId: comentario.usuarioId,
          mensaje: comentario.mensaje,
        })
        .returning();

      if (!inserted) {
        throw new Error("No se devolvieron filas tras realizar la inserción del comentario.");
      }

      return new Comentario(
        inserted.id,
        inserted.reporteId,
        inserted.usuarioId,
        inserted.mensaje,
        inserted.activo ?? undefined,
        inserted.fechaCreacion ?? undefined
      );
    } catch (error: any) {
      console.error("[Database Error] Error al registrar comentario:", error);
      throw new Error(`[Database Infrastructure Error]: ${error.message || "Fallo de persistencia del comentario."}`);
    }
  }

  /**
   * Obtiene todos los comentarios asociados a un reporte específico.
   * 
   * @param reporteId ID del reporte.
   * @returns Listado de comentarios del reporte.
   * @throws Error si ocurre un fallo al consultar en la persistencia.
   */
  async getCommentsByReporte(reporteId: number): Promise<Comentario[]> {
    try {
      const records = await db
        .select()
        .from(comentarios)
        .where(
          and(
            eq(comentarios.reporteId, reporteId),
            eq(comentarios.activo, true)
          )
        )
        .orderBy(desc(comentarios.fechaCreacion));

      return records.map(
        (row) =>
          new Comentario(
            row.id,
            row.reporteId,
            row.usuarioId,
            row.mensaje,
            row.activo ?? undefined,
            row.fechaCreacion ?? undefined
          )
      );
    } catch (error: any) {
      console.error("[Database Error] Error al listar comentarios:", error);
      throw new Error(`[Database Infrastructure Error]: ${error.message || "Fallo al consultar los comentarios."}`);
    }
  }
}
