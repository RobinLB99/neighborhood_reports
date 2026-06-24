import { z } from "zod";

export const RegisterFirstMemberSchema = z.object({
  barrioId: z.number({ message: "El barrioId es obligatorio y debe ser un número entero." }).int().positive("El barrioId debe ser un identificador válido (entero positivo)."),
});

export type RegisterFirstMemberDto = z.infer<typeof RegisterFirstMemberSchema>;
