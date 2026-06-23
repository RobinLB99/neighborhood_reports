import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../src/shared-kernel/http/cors.js";
import { getAuthenticatedUser } from "../../src/shared-kernel/http/auth.js";
import { DrizzleAuthRepository } from "../../src/authentication/infrastructure/database/DrizzleAuthRepository.js";
import { GetProfileUseCase } from "../../src/authentication/application/use-cases/GetProfileUseCase.js";
import { UserNotFoundError } from "../../src/shared-kernel/errors/DomainErrors.js";

/**
 * Handler HTTP GET /api/auth/me (Driving Adapter).
 * 
 * Recupera el perfil del usuario autenticado que emite la solicitud.
 * 
 * Flujo:
 * 1. Resuelve CORS.
 * 2. Extrae de forma segura el contexto de identidad (`userId`, `role`, `barrioId`)
 *    de las cabeceras HTTP que fueron previamente inyectadas por el Edge Middleware.
 * 3. Inyecta manualmente `DrizzleAuthRepository` en `GetProfileUseCase`.
 * 4. Obtiene el perfil limpio (excluyendo hash de contraseña).
 * 5. Gestiona las excepciones del dominio y de configuración del servidor.
 * 
 * @param request Petición entrante del cliente con el token en cabeceras.
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

  // Restringir exclusivamente a GET
  if (request.method !== "GET") {
    return response.status(405).json({
      error: "Method Not Allowed",
      message: "Este endpoint solo admite peticiones GET.",
    });
  }

  try {
    // 2. Extraer contexto de identidad inyectado por el Edge Middleware
    // Lanza un error si faltan las cabeceras x-user-id, x-user-role, x-user-barrio-id
    const userContext = getAuthenticatedUser(request);

    // 3. Inyección manual de dependencias
    const repository = new DrizzleAuthRepository();
    const useCase = new GetProfileUseCase(repository);

    // 4. Ejecución de la consulta de perfil
    const output = await useCase.execute(userContext.userId);

    return response.status(200).json({
      message: "Perfil de usuario recuperado exitosamente.",
      data: output,
    });
  } catch (error: any) {
    // 5. Manejo estructurado de errores
    if (error instanceof UserNotFoundError) {
      console.warn(`[Profile Warning] Usuario no encontrado: ${error.message}`);
      return response.status(404).json({
        error: "Not Found",
        message: error.message,
        code: error.code,
      });
    }

    // Si getAuthenticatedUser arroja un error debido a cabeceras ausentes o corruptas
    if (error instanceof Error && error.message.includes("Falta el contexto de usuario")) {
      console.error("[Security Configuration Error] Cabeceras de middleware ausentes:", error.message);
      return response.status(500).json({
        error: "Internal Server Error",
        message: "Error de configuración de seguridad interna en el servidor.",
      });
    }

    console.error("[Internal Server Error] Error crítico al obtener el perfil:", error);
    return response.status(500).json({
      error: "Internal Server Error",
      message: "Ha ocurrido un error inesperado en el servidor.",
    });
  }
}
