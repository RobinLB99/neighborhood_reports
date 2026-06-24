import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../src/shared-kernel/http/cors.js";
import { RegisterCommitteeSchema } from "../../src/committee/application/dtos/RegisterCommitteeDto.js";
import { DrizzleCommitteeRepository } from "../../src/committee/infrastructure/database/DrizzleCommitteeRepository.js";
import { RegisterCommitteeUseCase } from "../../src/committee/application/use-cases/RegisterCommitteeUseCase.js";
import {
  UsernameAlreadyTakenError,
  CommitteeAlreadyExistsError,
  BarrioNotFoundError,
} from "../../src/shared-kernel/errors/DomainErrors.js";

/**
 * Handler HTTP POST /api/auth/register-leader (Driving Adapter).
 * 
 * Permite fundar un comité barrial y dar de alta a su líder de forma pública (sin autenticación previa).
 * 
 * @param request Petición entrante del cliente con datos de registro del líder y barrio del comité.
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
    const result = RegisterCommitteeSchema.safeParse(request.body);

    if (!result.success) {
      console.warn(
        "[Validation Error] Fallo al validar cuerpo del registro de líder y comité:",
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
    const repository = new DrizzleCommitteeRepository();
    const useCase = new RegisterCommitteeUseCase(repository);

    // 4. Ejecución del flujo de negocio
    const output = await useCase.execute(result.data);

    console.info(
      `[Success] Comité fundado (ID: ${output.committeeId}) y líder registrado (ID: ${output.usuarioId}) exitosamente.`
    );

    return response.status(201).json({
      message: "Comité barrial y líder registrados exitosamente.",
      data: {
        comiteId: output.committeeId,
        usuarioId: output.usuarioId,
        miembroId: output.miembroId,
      },
    });
  } catch (error) {
    // 5. Manejo estructurado de excepciones de dominio
    if (error instanceof UsernameAlreadyTakenError) {
      console.warn(`[Committee Register Warning] Nombre de usuario ocupado: ${error.message}`);
      return response.status(409).json({
        error: "Conflict",
        message: error.message,
        code: error.code,
      });
    }

    if (error instanceof CommitteeAlreadyExistsError) {
      console.warn(`[Committee Register Warning] Comité ya existente en este barrio: ${error.message}`);
      return response.status(409).json({
        error: "Conflict",
        message: error.message,
        code: error.code,
      });
    }

    if (error instanceof BarrioNotFoundError) {
      console.warn(`[Committee Register Warning] Barrio no encontrado: ${error.message}`);
      return response.status(404).json({
        error: "Not Found",
        message: error.message,
        code: error.code,
      });
    }

    console.error("[Internal Server Error] Error crítico durante registro de líder y comité:", error);
    return response.status(500).json({
      error: "Internal Server Error",
      message: "Ha ocurrido un error inesperado en el servidor.",
    });
  }
}
