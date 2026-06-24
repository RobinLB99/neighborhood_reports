import { z } from "zod";

export const GetCitiesSchema = z.object({
  provinceId: z.coerce.number({ message: "El ID de la provincia es inválido." })
    .int("El ID de la provincia debe ser un número entero.")
    .positive("El ID de la provincia debe ser mayor a cero."),
});

export type GetCitiesDto = z.infer<typeof GetCitiesSchema>;
