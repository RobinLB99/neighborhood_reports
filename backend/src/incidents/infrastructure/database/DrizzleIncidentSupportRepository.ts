import { eq, and, sql } from "drizzle-orm";
import { db } from "../../../shared-kernel/database/drizzle.js";
import type { IncidentSupportRepository } from "../../domain/repositories/IncidentSupportRepository.interface.js";
import { apoyos } from "./schema.js";

/**
 * Adaptador de Persistencia (Driven Adapter) para Drizzle ORM.
 * 
 * Implementa el puerto IncidentSupportRepository para interactuar con la tabla
 * 'apoyos' en la base de datos PostgreSQL de Neon.
 */
export class DrizzleIncidentSupportRepository implements IncidentSupportRepository {
  /**
   * Alterna (registra o elimina) un apoyo para una incidencia por parte de un usuario.
   * 
   * @param usuarioId ID del usuario que realiza la acción.
   * @param reporteId ID de la incidencia que recibe el apoyo.
   * @returns `true` si se registró el apoyo, `false` si se eliminó.
   */
  async toggleSupport(usuarioId: number, reporteId: number): Promise<boolean> {
    try {
      // Intentar buscar si el usuario ya apoyó este reporte
      const [existing] = await db
        .select()
        .from(apoyos)
        .where(
          and(
            eq(apoyos.usuarioId, usuarioId),
            eq(apoyos.reporteId, reporteId)
          )
        )
        .limit(1);

      if (existing) {
        // Si existe, lo eliminamos (un-support)
        await db
          .delete(apoyos)
          .where(
            and(
              eq(apoyos.usuarioId, usuarioId),
              eq(apoyos.reporteId, reporteId)
            )
          );
        return false;
      }

      // Si no existe, lo creamos
      await db
        .insert(apoyos)
        .values({
          usuarioId,
          reporteId,
        });
      return true;
    } catch (error: any) {
      console.error("[Database Error] Error al alternar apoyo:", error);
      throw new Error(`[Database Infrastructure Error]: ${error.message || "Fallo de persistencia del apoyo."}`);
    }
  }

  /**
   * Obtiene la estadística de apoyos para un reporte.
   * 
   * @param reporteId ID de la incidencia.
   * @param usuarioId ID del usuario solicitante.
   */
  async getSupportStats(
    reporteId: number,
    usuarioId: number
  ): Promise<{ count: number; hasSupported: boolean }> {
    try {
      // 1. Obtener la cantidad de apoyos
      const [countResult] = await db
        .select({
          value: sql<number>`count(*)::int`,
        })
        .from(apoyos)
        .where(eq(apoyos.reporteId, reporteId));

      const count = countResult?.value || 0;

      // 2. Verificar si el usuario actual ha apoyado
      const [userSupport] = await db
        .select()
        .from(apoyos)
        .where(
          and(
            eq(apoyos.usuarioId, usuarioId),
            eq(apoyos.reporteId, reporteId)
          )
        )
        .limit(1);

      const hasSupported = !!userSupport;

      return {
        count,
        hasSupported,
      };
    } catch (error: any) {
      console.error("[Database Error] Error al obtener estadísticas de apoyos:", error);
      throw new Error(`[Database Infrastructure Error]: ${error.message || "Fallo al consultar apoyos."}`);
    }
  }
}
