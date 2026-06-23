import { z } from "zod";

export const LoginSchema = z.object({
  usuario: z.string({ message: "El nombre de usuario es obligatorio y debe ser texto." })
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres.")
    .regex(/^[a-z0-9_]+$/, "El nombre de usuario solo puede contener minúsculas, números y guiones bajos."),
  
  contrasena: z.string({ message: "La contraseña es obligatoria." })
    .min(6, "La contraseña debe tener al menos 6 caracteres."),
});

export type LoginDto = z.infer<typeof LoginSchema>;
