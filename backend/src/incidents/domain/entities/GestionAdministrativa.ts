import { z } from "zod";
import { ReportStatusSchema, type ReportStatus } from "./Reporte.js";

/**
 * Esquema de validación para el cuerpo de la petición al registrar una gestión administrativa.
 */
export const CreateGestionPayloadSchema = z.object({
  estadoAsignado: ReportStatusSchema,
  mensaje: z
    .string()
    .min(10, "El mensaje de la gestión debe tener al menos 10 caracteres.")
    .max(2000, "El mensaje de la gestión no puede exceder los 2000 caracteres."),
});

/**
 * Tipo inferido para el payload de creación de gestiones.
 */
export type CreateGestionPayload = z.infer<typeof CreateGestionPayloadSchema>;

/**
 * Esquema de validación para los parámetros de ruta al registrar una gestión.
 */
export const CreateGestionParamsSchema = z.object({
  id: z.coerce
    .number({ message: "El ID del reporte es inválido." })
    .int("El ID del reporte debe ser un número entero.")
    .positive("El ID del reporte debe ser mayor a cero."),
});

/**
 * Tipo inferido para los parámetros de ruta de gestiones.
 */
export type CreateGestionParams = z.infer<typeof CreateGestionParamsSchema>;

/**
 * Entidad de Dominio: GestionAdministrativa.
 * 
 * Representa una acción de gestión realizada por un líder o miembro del comité
 * sobre un reporte de incidencias, registrando el cambio de estado y un mensaje explicativo.
 */
export class GestionAdministrativa {
  constructor(
    public readonly id: number | undefined,
    public readonly reporteId: number,
    public readonly liderId: number,
    public readonly estadoAsignado: ReportStatus,
    public readonly mensaje: string,
    public readonly fechaGestion: Date | undefined,
    public readonly nombreLider?: string
  ) {}

  /**
   * Factory Method para instanciar de forma consistente una nueva gestión administrativa.
   */
  static create(
    reporteId: number,
    liderId: number,
    estadoAsignado: ReportStatus,
    mensaje: string
  ): GestionAdministrativa {
    if (!reporteId || reporteId <= 0) {
      throw new Error("El ID de reporte debe ser un entero positivo.");
    }
    if (!liderId || liderId <= 0) {
      throw new Error("El ID de líder/usuario ejecutor debe ser un entero positivo.");
    }
    if (!estadoAsignado) {
      throw new Error("El estado asignado es obligatorio.");
    }
    if (!mensaje || mensaje.trim().length < 10) {
      throw new Error("El mensaje de gestión debe tener al menos 10 caracteres.");
    }
    if (mensaje.trim().length > 2000) {
      throw new Error("El mensaje de gestión no puede exceder los 2000 caracteres.");
    }

    return new GestionAdministrativa(
      undefined,
      reporteId,
      liderId,
      estadoAsignado,
      mensaje.trim(),
      undefined,
      undefined
    );
  }
}
