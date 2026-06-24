import { z } from "zod";

export const GetNeighborhoodsSchema = z.object({
  cityId: z.coerce.number({ message: "El ID de la ciudad es inválido." })
    .int("El ID de la ciudad debe ser un número entero.")
    .positive("El ID de la ciudad debe ser mayor a cero."),
});

export type GetNeighborhoodsDto = z.infer<typeof GetNeighborhoodsSchema>;
