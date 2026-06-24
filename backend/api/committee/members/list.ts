import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../../src/shared-kernel/http/cors.js";
import { getAuthenticatedUser } from "../../../src/shared-kernel/http/auth.js";
import { DrizzleCommitteeRepository } from "../../../src/committee/infrastructure/database/DrizzleCommitteeRepository.js";
import { GetCommitteeMembersUseCase } from "../../../src/committee/application/use-cases/GetCommitteeMembersUseCase.js";
import { CommitteeNotFoundError } from "../../../src/shared-kernel/errors/DomainErrors.js";

/**
 * Handler HTTP GET /api/committee/members/list (Driving Adapter).
 * 
 * Permite a los líderes o miembros del comité barrial consultar la lista completa
 * de los miembros directivos (Presidente, Secretario, Vocal) de su propio barrio.
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

  // Restringir exclusivamente a GET
  if (request.method !== "GET") {
    return response.status(405).json({
      error: "Method Not Allowed",
      message: "Este endpoint solo admite peticiones GET.",
    });
  }

  try {
    // 2. Autenticación y Autorización
    const userContext = getAuthenticatedUser(request);

    // Validar rol: Solo líder o miembro
    if (userContext.role !== "lider" && userContext.role !== "miembro") {
      console.warn(`[Security Warning] Intento de consulta de comite denegado: rol '${userContext.role}' insuficiente.`);
      return response.status(403).json({
        error: "Forbidden",
        message: "Acceso denegado. Solo los líderes o miembros del comité pueden listar los miembros de la directiva.",
      });
    }

    if (!userContext.barrioId) {
      console.warn(`[Security Warning] El usuario autenticado no está asociado a ningún barrio.`);
      return response.status(400).json({
        error: "Bad Request",
        message: "El usuario solicitante debe pertenecer a un barrio para realizar esta consulta.",
      });
    }

    // 3. Inyección manual de dependencias
    const committeeRepository = new DrizzleCommitteeRepository();
    const useCase = new GetCommitteeMembersUseCase(committeeRepository);

    // 4. Ejecución del flujo de negocio
    const data = await useCase.execute(userContext.barrioId);

    console.info(`[Success] Miembros del comité devueltos con éxito para el barrio: ${userContext.barrioId}. Total: ${data.length}`);

    return response.status(200).json({
      message: "Miembros del comité recuperados exitosamente.",
      data,
    });
  } catch (error: any) {
    if (error instanceof CommitteeNotFoundError) {
      console.warn(`[Committee Members Warning] Comité no encontrado: ${error.message}`);
      return response.status(404).json({
        error: "Not Found",
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

    console.error("[Internal Server Error] Error crítico al obtener miembros del comité:", error);
    return response.status(500).json({
      error: "Internal Server Error",
      message: "Ha ocurrido un error inesperado en el servidor.",
    });
  }
}
