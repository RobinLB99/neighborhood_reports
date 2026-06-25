import { z } from "zod";

/**
 * Esquema de validación para la creación de un nuevo comentario (Cuerpo del Request).
 */
export const CreateCommentPayloadSchema = z.object({
  mensaje: z
    .string()
    .min(1, "El mensaje no puede estar vacío.")
    .max(500, "El mensaje no puede exceder los 500 caracteres."),
});

/**
 * Tipo inferido para el payload de creación de comentarios.
 */
export type CreateCommentPayload = z.infer<typeof CreateCommentPayloadSchema>;

/**
 * Esquema de validación para los parámetros de ruta al agregar comentarios.
 */
export const AddCommentParamsSchema = z.object({
  id: z.coerce.number({ message: "El ID del reporte es inválido." })
    .int("El ID del reporte debe ser un número entero.")
    .positive("El ID del reporte debe ser mayor a cero."),
});

/**
 * Tipo inferido para los parámetros de ruta de comentarios.
 */
export type AddCommentParams = z.infer<typeof AddCommentParamsSchema>;

/**
 * Entidad de Dominio: Comentario.
 * 
 * Representa un comentario registrado por un vecino o miembro del comité en un reporte.
 */
export class Comentario {
  constructor(
    public readonly id: number | undefined,
    public readonly reporteId: number,
    public readonly usuarioId: number,
    public readonly mensaje: string,
    public readonly activo: boolean | undefined,
    public readonly fechaCreacion: Date | undefined
  ) {}

  static create(
    reporteId: number,
    usuarioId: number,
    mensaje: string
  ): Comentario {
    if (!reporteId || reporteId <= 0) {
      throw new Error("El ID de reporte debe ser un entero positivo.");
    }
    if (!usuarioId || usuarioId <= 0) {
      throw new Error("El ID de usuario debe ser un entero positivo.");
    }
    if (!mensaje || mensaje.trim().length === 0) {
      throw new Error("El mensaje del comentario es obligatorio.");
    }
    if (mensaje.trim().length > 500) {
      throw new Error("El mensaje del comentario no puede exceder los 500 caracteres.");
    }

    return new Comentario(
      undefined,
      reporteId,
      usuarioId,
      mensaje.trim(),
      true,
      undefined
    );
  }
}
