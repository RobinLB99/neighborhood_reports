import { eq, desc } from "drizzle-orm";
import { db } from "../../../shared-kernel/database/drizzle.js";
import { GestionAdministrativa } from "../../domain/entities/GestionAdministrativa.js";
import type { IncidentGestionRepository } from "../../domain/repositories/IncidentGestionRepository.interface.js";
import { gestionesDirectiva, reportes } from "./schema.js";
import { type ReportStatus } from "../../domain/entities/Reporte.js";
import { usuarios } from "../../../authentication/infrastructure/database/schema.js";

/**
 * Adaptador de Persistencia (Driven Adapter) para Drizzle ORM.
 * 
 * Implementa el puerto IncidentGestionRepository para realizar operaciones transaccionales
 * sobre las tablas 'gestiones_directiva' y 'reportes' en la base de datos PostgreSQL.
 */
export class DrizzleIncidentGestionRepository implements IncidentGestionRepository {
  /**
   * Registra una gestión directiva y actualiza el estado del reporte asociado de forma atómica.
   * 
   * @param gestion Entidad de dominio GestionAdministrativa.
   * @returns La nueva entidad de dominio con los campos autogenerados por la base de datos (id, fechaGestion).
   */
  async registrarGestionYActualizarEstado(
    gestion: GestionAdministrativa
  ): Promise<GestionAdministrativa> {
    try {
      return await db.transaction(async (tx) => {
        // 1. Insertar el registro en la tabla de bitácora gestiones_directiva
        const [inserted] = await tx
          .insert(gestionesDirectiva)
          .values({
            reporteId: gestion.reporteId,
            liderId: gestion.liderId,
            estadoAsignado: gestion.estadoAsignado,
            mensaje: gestion.mensaje,
          })
          .returning();

        if (!inserted) {
          throw new Error("No se pudo insertar el registro de gestión directiva.");
        }

        // 2. Actualizar el estado y fecha de actualización en la tabla reportes
        const updateResult = await tx
          .update(reportes)
          .set({
            estado: gestion.estadoAsignado,
            fechaActualizacion: new Date(),
          })
          .where(eq(reportes.id, gestion.reporteId));

        if (!updateResult) {
          throw new Error(`No se pudo actualizar el estado del reporte con ID ${gestion.reporteId}.`);
        }

        // 3. Devolver la entidad de dominio mapeada
        return new GestionAdministrativa(
          inserted.id,
          inserted.reporteId,
          inserted.liderId,
          inserted.estadoAsignado as ReportStatus,
          inserted.mensaje,
          inserted.fechaGestion ?? undefined
        );
      });
    } catch (error: any) {
      console.error("[Database Transaction Error] Error al registrar gestión administrativa:", error);
      throw new Error(`[Database Infrastructure Error]: ${error.message || "Fallo de transacción desconocido."}`);
    }
  }

  /**
   * Obtiene la lista de gestiones administrativas asociadas a un reporte.
   * Cruza con la tabla de usuarios para obtener el nombre del líder/miembro.
   * Ordena en forma descendente por la fecha de gestión.
   * 
   * @param reporteId ID del reporte.
   * @returns Lista de entidades GestionAdministrativa con la información extendida del líder.
   */
  async obtenerGestionesPorReporteId(
    reporteId: number
  ): Promise<GestionAdministrativa[]> {
    try {
      const records = await db
        .select({
          id: gestionesDirectiva.id,
          reporteId: gestionesDirectiva.reporteId,
          liderId: gestionesDirectiva.liderId,
          estadoAsignado: gestionesDirectiva.estadoAsignado,
          mensaje: gestionesDirectiva.mensaje,
          fechaGestion: gestionesDirectiva.fechaGestion,
          nombreLider: usuarios.nombre,
        })
        .from(gestionesDirectiva)
        .leftJoin(usuarios, eq(gestionesDirectiva.liderId, usuarios.id))
        .where(eq(gestionesDirectiva.reporteId, reporteId))
        .orderBy(desc(gestionesDirectiva.fechaGestion));

      return records.map(
        (row) =>
          new GestionAdministrativa(
            row.id,
            row.reporteId,
            row.liderId,
            row.estadoAsignado as ReportStatus,
            row.mensaje,
            row.fechaGestion ?? undefined,
            row.nombreLider ?? undefined
          )
      );
    } catch (error: any) {
      console.error("[Database Error] Error al obtener gestiones de directiva:", error);
      throw new Error(`[Database Infrastructure Error]: ${error.message || "Fallo al consultar las gestiones."}`);
    }
  }
}
