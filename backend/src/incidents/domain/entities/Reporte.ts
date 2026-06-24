import { z } from "zod";

/**
 * Los estados permitidos en el ciclo de vida de un reporte ciudadano.
 * - 'pendiente': Reporte registrado por un vecino que aún no ha sido revisado o gestionado por el comité barrial.
 * - 'en_gestion': El comité barrial ha tomado control del reporte y está gestionándolo con las autoridades o recursos propios.
 * - 'solucionado': La incidencia reportada ha sido resuelta satisfactoriamente.
 */
export const REPORT_STATUSES = ["pendiente", "en_gestion", "solucionado"] as const;

/**
 * Tipo estático de TypeScript inferido para los estados del reporte.
 */
export type ReportStatus = typeof REPORT_STATUSES[number];

/**
 * Validador Zod para asegurar la consistencia del estado del reporte en los DTOs y capas de entrada.
 */
export const ReportStatusSchema = z.enum(REPORT_STATUSES);

/**
 * Esquema de validación para la creación de un nuevo reporte desde el frontend (Cuerpo del Request).
 */
export const CreateReportPayloadSchema = z.object({
  direccion: z
    .string()
    .min(5, "La dirección debe tener al menos 5 caracteres.")
    .max(255, "La dirección no puede exceder los 255 caracteres."),
  ubicacion: z
    .string()
    .regex(
      /^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/,
      "Las coordenadas de ubicación deben tener el formato 'latitud,longitud' (ej. -2.145, -79.888)."
    ),
  fotoUrl: z
    .string()
    .url("La URL de la foto de la incidencia debe ser una URL de Cloudinary válida."),
  descripcion: z
    .string()
    .min(10, "La descripción del reporte debe tener al menos 10 caracteres.")
    .max(2000, "La descripción no puede exceder los 2000 caracteres."),
});

/**
 * Tipo de datos inferido del esquema de creación de reportes.
 */
export type CreateReportPayload = z.infer<typeof CreateReportPayloadSchema>;

/**
 * Entidad de Dominio: Reporte.
 * 
 * Representa una incidencia barrial o reporte de problemas en la infraestructura,
 * seguridad o servicios del territorio, registrado por un vecino para gestión del comité.
 * Esta clase es pura y encapsula las reglas de consistencia de un reporte.
 */
export class Reporte {
  /**
   * @param id Identificador único de base de datos (undefined para reportes nuevos no persistidos).
   * @param usuarioId ID del vecino creador del reporte.
   * @param barrioId ID del barrio donde ocurre el reporte.
   * @param direccion Dirección física legible donde ocurrió la incidencia.
   * @param ubicacion Coordenadas GPS en formato de texto "latitud,longitud".
   * @param fotoUrl URL de la foto que evidencia el reporte.
   * @param estado Estado del ciclo de vida del reporte ('pendiente', 'en_gestion', 'solucionado').
   * @param descripcion Descripción textual detallada del reporte.
   * @param activo Estado de borrado lógico.
   * @param fechaCreacion Fecha en que se creó el reporte.
   * @param fechaActualizacion Fecha de última modificación.
   */
  constructor(
    public readonly id: number | undefined,
    public readonly usuarioId: number,
    public readonly barrioId: number,
    public readonly direccion: string,
    public readonly ubicacion: string,
    public readonly fotoUrl: string,
    public readonly estado: ReportStatus,
    public readonly descripcion: string,
    public readonly activo: boolean | undefined,
    public readonly fechaCreacion: Date | undefined,
    public readonly fechaActualizacion: Date | undefined
  ) {}

  /**
   * Factory Method para instanciar de manera consistente un reporte nuevo.
   * 
   * @throws Error si falla alguna regla esencial de consistencia del dominio.
   */
  static create(
    usuarioId: number,
    barrioId: number,
    direccion: string,
    ubicacion: string,
    fotoUrl: string,
    descripcion: string
  ): Reporte {
    if (!usuarioId || usuarioId <= 0) {
      throw new Error("El ID de usuario creador del reporte debe ser un entero positivo.");
    }
    if (!barrioId || barrioId <= 0) {
      throw new Error("El ID de barrio debe ser un entero positivo.");
    }
    if (!direccion || direccion.trim().length < 5) {
      throw new Error("La dirección debe tener al menos 5 caracteres.");
    }
    // Validación de regex de coordenadas
    const ubicacionRegex = /^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/;
    if (!ubicacion || !ubicacionRegex.test(ubicacion)) {
      throw new Error("La ubicación debe tener el formato 'latitud,longitud' válido.");
    }
    if (!fotoUrl || fotoUrl.trim() === "") {
      throw new Error("La URL de la foto de la incidencia es obligatoria.");
    }
    try {
      new URL(fotoUrl);
    } catch (_) {
      throw new Error("La URL de la foto debe ser una URL sintácticamente correcta.");
    }
    if (!descripcion || descripcion.trim().length < 10) {
      throw new Error("La descripción del reporte debe tener al menos 10 caracteres.");
    }

    return new Reporte(
      undefined,
      usuarioId,
      barrioId,
      direccion.trim(),
      ubicacion.trim(),
      fotoUrl.trim(),
      "pendiente",
      descripcion.trim(),
      true,
      undefined,
      undefined
    );
  }
}
