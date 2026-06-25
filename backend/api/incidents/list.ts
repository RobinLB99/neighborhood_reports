import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../src/shared-kernel/http/cors.js";
import { getAuthenticatedUser } from "../../src/shared-kernel/http/auth.js";
import { DrizzleIncidentRepository } from "../../src/incidents/infrastructure/database/DrizzleIncidentRepository.js";
import { ListReportsUseCase } from "../../src/incidents/application/use-cases/ListReportsUseCase.js";

/**
 * Handler HTTP GET /api/incidents/list (Driving Adapter).
 * 
 * Recupera el listado de reportes del barrio asociado al usuario autenticado,
 * filtrados opcionalmente por estado.
 * 
 * @param request Petición entrante del cliente.
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
    // 2. Autenticación y obtención de contexto de identidad
    const userContext = getAuthenticatedUser(request);

    // 3. Inyección manual de dependencias
    const repository = new DrizzleIncidentRepository();
    const useCase = new ListReportsUseCase(repository);

    // 4. Ejecución del flujo de negocio
    const status = request.query.status as string | undefined;
    const reports = await useCase.execute({
      barrioId: userContext.barrioId,
      estado: status,
    });

    console.info(`[Success] Se listaron ${reports.length} reportes para el barrio ID ${userContext.barrioId}.`);

    return response.status(200).json({
      message: "Listado de reportes recuperado exitosamente.",
      data: reports.map((report) => ({
        id: report.id,
        usuarioId: report.usuarioId,
        barrioId: report.barrioId,
        direccion: report.direccion,
        ubicacion: report.ubicacion,
        fotoUrl: report.fotoUrl,
        estado: report.estado,
        descripcion: report.descripcion,
        fechaCreacion: report.fechaCreacion,
        fechaActualizacion: report.fechaActualizacion,
      })),
    });
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("Falta el contexto de usuario")) {
      console.error("[Security Configuration Error] Cabeceras de middleware ausentes:", error.message);
      return response.status(500).json({
        error: "Internal Server Error",
        message: "Error de configuración de seguridad interna en el servidor.",
      });
    }

    console.error("[Internal Server Error] Error crítico al obtener el listado de reportes:", error);
    return response.status(500).json({
      error: "Internal Server Error",
      message: "Ha ocurrido un error inesperado al recuperar el listado de reportes.",
    });
  }
}
