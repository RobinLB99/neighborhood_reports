import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../src/shared-kernel/http/cors.js";
import { getAuthenticatedUser } from "../../src/shared-kernel/http/auth.js";
import { RegisterCommitteeMemberSchema } from "../../src/committee/application/dtos/RegisterCommitteeMemberDto.js";
import { DrizzleCommitteeRepository } from "../../src/committee/infrastructure/database/DrizzleCommitteeRepository.js";
import { DrizzleAuthRepository } from "../../src/authentication/infrastructure/database/DrizzleAuthRepository.js";
import { RegisterCommitteeMemberUseCase } from "../../src/committee/application/use-cases/RegisterCommitteeMemberUseCase.js";
import {
  UserNotFoundError,
  CommitteeNotFoundError,
  UserBarrioMismatchError,
  UserAlreadyInCommitteeError,
} from "../../src/shared-kernel/errors/DomainErrors.js";

/**
 * Handler HTTP POST /api/committee/members (Driving Adapter).
 * 
 * Permite a un líder de comité barrial promover un vecino existente a miembro de la directiva (Secretario, Vocal).
 * 
 * @param request Petición entrante del cliente con credenciales JWT en cabeceras.
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
    // 2. Autenticación y Autorización
    const userContext = getAuthenticatedUser(request);

    // Validar rol de líder
    if (userContext.role !== "lider") {
      console.warn(`[Security Warning] Intento de registro de miembro denegado: rol '${userContext.role}' insuficiente.`);
      return response.status(403).json({
        error: "Forbidden",
        message: "Acceso denegado. Solo los usuarios con el rol de líder pueden registrar miembros en el comité.",
      });
    }

    // 3. Validación de contrato Zod
    const validationResult = RegisterCommitteeMemberSchema.safeParse(request.body);

    if (!validationResult.success) {
      console.warn(
        "[Validation Error] Fallo al validar cuerpo del registro de miembro:",
        validationResult.error.issues
      );
      return response.status(400).json({
        error: "Bad Request",
        message: "El payload enviado no cumple con las validaciones requeridas.",
        details: validationResult.error.issues.map((err) => ({
          campo: err.path.join("."),
          mensaje: err.message,
        })),
      });
    }

    // 4. Inyección manual de dependencias
    const committeeRepository = new DrizzleCommitteeRepository();
    const authRepository = new DrizzleAuthRepository();
    const useCase = new RegisterCommitteeMemberUseCase(committeeRepository, authRepository);

    // 5. Ejecución del flujo de negocio
    const output = await useCase.execute(userContext.barrioId, validationResult.data);

    console.info(
      `[Success] Vecino promovido a miembro directivo del comité exitosamente. Miembro ID: ${output.miembroId}.`
    );

    return response.status(201).json({
      message: "Miembro del comité registrado exitosamente.",
      data: {
        miembroId: output.miembroId,
      },
    });
  } catch (error: any) {
    // 6. Manejo estructurado de excepciones de dominio
    if (error instanceof UserNotFoundError) {
      console.warn(`[Committee Member Warning] Usuario no encontrado: ${error.message}`);
      return response.status(404).json({
        error: "Not Found",
        message: error.message,
        code: error.code,
      });
    }

    if (error instanceof CommitteeNotFoundError) {
      console.warn(`[Committee Member Warning] Comité no encontrado: ${error.message}`);
      return response.status(404).json({
        error: "Not Found",
        message: error.message,
        code: error.code,
      });
    }

    if (error instanceof UserBarrioMismatchError) {
      console.warn(`[Committee Member Warning] El usuario no pertenece al barrio del líder: ${error.message}`);
      return response.status(400).json({
        error: "Bad Request",
        message: error.message,
        code: error.code,
      });
    }

    if (error instanceof UserAlreadyInCommitteeError) {
      console.warn(`[Committee Member Warning] El usuario ya pertenece a un comité: ${error.message}`);
      return response.status(409).json({
        error: "Conflict",
        message: error.message,
        code: error.code,
      });
    }

    if (error instanceof Error && error.message.includes("Falta el contexto de usuario")) {
      console.error("[Security Configuration Error] Cabeceras de middleware ausentes:", error.message);
      return response.status(500).json({
        error: "Internal Server Error",
        message: "Error de configuración de seguridad interna en el servidor.",
      });
    }

    console.error("[Internal Server Error] Error crítico durante promoción de miembro del comité:", error);
    return response.status(500).json({
      error: "Internal Server Error",
      message: "Ha ocurrido un error inesperado en el servidor.",
    });
  }
}
