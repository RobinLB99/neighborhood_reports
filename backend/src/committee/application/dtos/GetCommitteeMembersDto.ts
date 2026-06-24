import { z } from "zod";

/**
 * Esquema Zod para un miembro individual del comité barrial enriquecido con datos del usuario.
 */
export const CommitteeMemberItemSchema = z.object({
  id: z.number({ message: "El ID del miembro debe ser un número." }),
  usuarioId: z.number({ message: "El ID de usuario debe ser un número." }),
  nombre: z.string({ message: "El nombre debe ser un texto." }),
  usuario: z.string({ message: "El nombre de usuario debe ser un texto." }),
  rol: z.enum(["Presidente", "Secretario", "Vocal"], {
    message: "El rol dentro del comité debe ser 'Presidente', 'Secretario' o 'Vocal'.",
  }),
  fechaRegistro: z.string().nullable().optional(),
});

/**
 * Esquema de respuesta HTTP para la lista de miembros de un comité.
 */
export const CommitteeMembersListResponseSchema = z.object({
  message: z.string(),
  data: z.array(CommitteeMemberItemSchema),
});

export type CommitteeMemberItemDto = z.infer<typeof CommitteeMemberItemSchema>;
export type CommitteeMembersListResponseDto = z.infer<typeof CommitteeMembersListResponseSchema>;
