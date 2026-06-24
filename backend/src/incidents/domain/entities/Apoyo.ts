import { z } from "zod";

/**
 * Esquema para validar los parámetros de la ruta dinámica que identifica al reporte.
 */
export const IncidentSupportParamsSchema = z.object({
  id: z.coerce.number({ message: "El ID del reporte es inválido." })
    .int("El ID del reporte debe ser un número entero.")
    .positive("El ID del reporte debe ser mayor a cero."),
});

/**
 * Tipo inferido de los parámetros de soporte.
 */
export type IncidentSupportParams = z.infer<typeof IncidentSupportParamsSchema>;

/**
 * Esquema de respuesta para las estadísticas de apoyos de un reporte.
 */
export const SupportStatsResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    count: z.number(),
    hasSupported: z.boolean(),
  }),
});

/**
 * Tipo de datos inferido de la respuesta de estadísticas de apoyo.
 */
export type SupportStatsResponse = z.infer<typeof SupportStatsResponseSchema>;
