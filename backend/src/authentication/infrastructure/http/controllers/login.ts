import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../../../shared-kernel/http/cors.js";
import { LoginSchema } from "../../../../authentication/application/dtos/LoginDto.js";
import { DrizzleAuthRepository } from "../../../../authentication/infrastructure/database/DrizzleAuthRepository.js";
import { LoginUseCase } from "../../../../authentication/application/use-cases/LoginUseCase.js";
import { InvalidCredentialsError } from "../../../../shared-kernel/errors/DomainErrors.js";

/**
 * Handler HTTP POST /api/auth/login (Driving Adapter).
 * 
 * Permite a los usuarios del sistema iniciar sesión y obtener un token JWT firmado.
 * 
 * Flujo:
 * 1. Resuelve cabeceras y métodos CORS permitidos.
 * 2. Valida la estructura del body del request mediante el schema de Zod `LoginSchema`.
 * 3. Inyecta manualmente las dependencias en `LoginUseCase` instanciando `DrizzleAuthRepository`.
 * 4. Ejecuta el caso de uso de autenticación de negocio.
 * 5. Controla errores de negocio devolviendo estados HTTP coherentes (400, 401, 500).
 * 
 * @param request Petición entrante del cliente con credenciales de usuario.
 * @param response Respuesta HTTP emitida hacia el cliente.
 */
export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // 1. Aplicar políticas CORS dinámicas
  if (handleCors(request, response)) {
    return;
  }

  // Restringir exclusivamente a POST
  if (request.method !== "POST") {
    return response.status(405).json({
      error: "Method Not Allowed",
      message: "Este endpoint solo admite peticiones POST.",
    });
  }

  try {
    // 2. Validación de contrato Zod
    const result = LoginSchema.safeParse(request.body);

    if (!result.success) {
      console.warn(
        "[Validation Error] Fallo al validar cuerpo del login:",
        result.error.issues
      );
      return response.status(400).json({
        error: "Bad Request",
        message: "El payload enviado no cumple con las validaciones requeridas.",
        details: result.error.issues.map((err) => ({
          campo: err.path.join("."),
          mensaje: err.message,
        })),
      });
    }

    // 3. Inyección manual de dependencias
    const repository = new DrizzleAuthRepository();
    const useCase = new LoginUseCase(repository);

    // 4. Ejecución del flujo de negocio
    const output = await useCase.execute(result.data);

    console.info(`[Success] Sesión iniciada para usuario: ${result.data.usuario}`);

    return response.status(200).json({
      message: "Autenticación exitosa.",
      data: output,
    });
  } catch (error) {
    // 5. Manejo estructurado de excepciones de dominio
    if (error instanceof InvalidCredentialsError) {
      console.warn(`[Auth Warning] Intento de login fallido: ${error.message}`);
      return response.status(401).json({
        error: "Unauthorized",
        message: "El nombre de usuario o la contraseña son incorrectos.",
        code: error.code,
      });
    }

    console.error("[Internal Server Error] Error crítico durante login:", error);
    return response.status(500).json({
      error: "Internal Server Error",
      message: "Ha ocurrido un error inesperado en el servidor.",
    });
  }
}
