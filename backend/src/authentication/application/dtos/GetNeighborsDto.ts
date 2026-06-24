import { z } from "zod";

export const NeighborSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  usuario: z.string(),
  fechaRegistro: z.string().optional(),
});

export const NeighborsResponseSchema = z.array(NeighborSchema);

export type NeighborDto = z.infer<typeof NeighborSchema>;
