import { z } from "zod";

export const RegisterCommitteeMemberSchema = z.object({
  usuarioId: z
    .number({ message: "El usuarioId es obligatorio y debe ser un número entero." })
    .int()
    .positive("El usuarioId debe ser un identificador válido (entero positivo)."),

  rolComite: z.enum(["Secretario", "Vocal"], {
    message: "El rolComite debe ser 'Secretario' o 'Vocal'.",
  }),
});

export type RegisterCommitteeMemberDto = z.infer<typeof RegisterCommitteeMemberSchema>;
