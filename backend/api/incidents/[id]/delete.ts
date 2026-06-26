import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../../src/shared-kernel/http/cors.js";
import { getAuthenticatedUser } from "../../../src/shared-kernel/http/auth.js";
import { DrizzleIncidentRepository } from "../../../src/incidents/infrastructure/database/DrizzleIncidentRepository.js";
import { DeleteIncidentUseCase } from "../../../src/incidents/application/use-cases/DeleteIncidentUseCase.js";
import { z } from "zod";

// Esquema de validación para los parámetros de ruta al eliminar.
const DeleteIncidentParamsSchema = z.object({
  id: z.coerce
    .number({ message: "El ID del reporte es inválido." })
    .int("El ID del reporte debe ser un número entero.")
    .positive("El ID del reporte debe ser mayor a cero."),
});

/**
 * Handler HTTP DELETE /api/incidents/[id]/delete (Driving Adapter).
 * 
 * Permite realizar el borrado lógico de una incidencia barrial.
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

  // Restringir exclusivamente a DELETE
  if (request.method !== "DELETE") {
    return response.status(405).json({
      error: "Method Not Allowed",
      message: "Este endpoint solo admite peticiones DELETE.",
    });
  }

  try {
    // 2. Autenticación y obtención de contexto de identidad
    const userContext = getAuthenticatedUser(request);

    // 3. Validar el ID del reporte obtenido de los parámetros de la ruta
    const paramsParseResult = DeleteIncidentParamsSchema.safeParse(request.query);
    if (!paramsParseResult.success) {
      console.warn("[Validation Error] ID de reporte inválido en ruta de eliminación:", paramsParseResult.error.issues);
      return response.status(400).json({
        error: "Bad Request",
        message: "El ID del reporte proporcionado en la ruta es inválido.",
        details: paramsParseResult.error.issues.map((err) => ({
          campo: err.path.join("."),
          mensaje: err.message,
        })),
      });
    }

    const { id: reportId } = paramsParseResult.data;

    // 4. Inyección manual de dependencias
    const repository = new DrizzleIncidentRepository();
    const useCase = new DeleteIncidentUseCase(repository);

    // 5. Ejecución del flujo de negocio
    await useCase.execute({
      reportId,
      userId: userContext.userId,
      userRole: userContext.role,
    });

    console.info(`[Success] Reporte ID ${reportId} eliminado lógicamente por el usuario ${userContext.userId}.`);

    return response.status(200).json({
      message: "El reporte de incidencia ha sido eliminado exitosamente.",
    });
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("Falta el contexto de usuario")) {
      console.error("[Security Configuration Error] Cabeceras de middleware ausentes:", error.message);
      return response.status(500).json({
        error: "Internal Server Error",
        message: "Error de configuración de seguridad interna en el servidor.",
      });
    }

    if (error instanceof Error && error.message.includes("[NotFound]")) {
      console.warn(`[Incidents Warning] Reporte no encontrado para eliminar: ${error.message}`);
      return response.status(404).json({
        error: "Not Found",
        message: error.message.replace("[NotFound] ", ""),
      });
    }

    if (error instanceof Error && error.message.includes("[Unauthorized]")) {
      console.warn(`[Security Warning] Permisos insuficientes al intentar eliminar reporte: ${error.message}`);
      return response.status(403).json({
        error: "Forbidden",
        message: error.message.replace("[Unauthorized] ", ""),
      });
    }

    console.error("[Internal Server Error] Error crítico al eliminar el reporte de incidencia:", error);
    return response.status(500).json({
      error: "Internal Server Error",
      message: "Ha ocurrido un error inesperado al eliminar el reporte.",
    });
  }
}
