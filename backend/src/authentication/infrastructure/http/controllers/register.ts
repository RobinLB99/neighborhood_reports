import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../../../shared-kernel/http/cors.js";
import { RegisterUserSchema } from "../../../../authentication/application/dtos/RegisterUserDto.js";
import { DrizzleAuthRepository } from "../../../../authentication/infrastructure/database/DrizzleAuthRepository.js";
import { DrizzleCommitteeExistsGateway } from "../../../../authentication/infrastructure/database/DrizzleCommitteeExistsGateway.js";
import { RegisterUserUseCase } from "../../../../authentication/application/use-cases/RegisterUserUseCase.js";
import {
  UsernameAlreadyTakenError,
  BarrioNotFoundError,
  CommitteeNotFoundError,
} from "../../../../shared-kernel/errors/DomainErrors.js";

/**
 * Handler HTTP POST /api/auth/register (Driving Adapter).
 * 
 * Permite a nuevos usuarios registrarse en el sistema.
 * 
 * @param request Petición entrante del cliente con datos de registro.
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
    const result = RegisterUserSchema.safeParse(request.body);

    if (!result.success) {
      console.warn(
        "[Validation Error] Fallo al validar cuerpo del registro:",
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
    const committeeGateway = new DrizzleCommitteeExistsGateway();
    const useCase = new RegisterUserUseCase(repository, committeeGateway);

    // 4. Ejecución del flujo de negocio
    const output = await useCase.execute(result.data);

    console.info(`[Success] Usuario registrado exitosamente: ${output.usuario}`);

    return response.status(201).json({
      message: "Usuario registrado exitosamente.",
      data: output,
    });
  } catch (error) {
    // 5. Manejo estructurado de excepciones de dominio
    if (error instanceof UsernameAlreadyTakenError) {
      console.warn(`[Auth Warning] Intento de registro fallido: ${error.message}`);
      return response.status(409).json({
        error: "Conflict",
        message: error.message,
        code: error.code,
      });
    }

    if (error instanceof BarrioNotFoundError) {
      console.warn(`[Auth Warning] Barrio no encontrado: ${error.message}`);
      return response.status(404).json({
        error: "Not Found",
        message: error.message,
        code: error.code,
      });
    }

    if (error instanceof CommitteeNotFoundError) {
      console.warn(`[Auth Warning] Comité no encontrado para el barrio del registro: ${error.message}`);
      return response.status(403).json({
        error: "Forbidden",
        message: error.message,
        code: error.code,
      });
    }

    console.error("[Internal Server Error] Error crítico durante registro de usuario:", error);
    return response.status(500).json({
      error: "Internal Server Error",
      message: "Ha ocurrido un error inesperado en el servidor.",
    });
  }
}
