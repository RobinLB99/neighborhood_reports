import { z } from "zod";

export const RegisterUserSchema = z.object({
  nombre: z.string({ message: "El nombre es obligatorio y debe ser texto." }).min(3, "El nombre debe tener al menos 3 caracteres."),
  
  usuario: z.string({ message: "El nombre de usuario es obligatorio y debe ser texto." })
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres.")
    .regex(/^[a-z0-9_]+$/, "El nombre de usuario solo puede contener minúsculas, números y guiones bajos."),
  
  contrasena: z.string({ message: "La contraseña es obligatoria." }).min(6, "La contraseña debe tener al menos 6 caracteres."),
  
  barrioId: z.number({ message: "El barrioId es obligatorio y debe ser un número entero." }).int().positive("El barrioId debe ser un identificador válido (entero positivo)."),
});

export type RegisterUserDto = z.infer<typeof RegisterUserSchema>;
