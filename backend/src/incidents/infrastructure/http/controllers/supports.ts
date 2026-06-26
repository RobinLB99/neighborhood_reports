import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../../../shared-kernel/http/cors.js";
import { getAuthenticatedUser } from "../../../../shared-kernel/http/auth.js";
import { DrizzleIncidentRepository } from "../../../../incidents/infrastructure/database/DrizzleIncidentRepository.js";
import { DrizzleIncidentSupportRepository } from "../../../../incidents/infrastructure/database/DrizzleIncidentSupportRepository.js";
import { ToggleIncidentSupportUseCase } from "../../../../incidents/application/use-cases/ToggleIncidentSupportUseCase.js";
import { GetIncidentSupportsUseCase } from "../../../../incidents/application/use-cases/GetIncidentSupportsUseCase.js";
import { IncidentSupportParamsSchema } from "../../../../incidents/domain/entities/Apoyo.js";
import { ReporteNotFoundError } from "../../../../shared-kernel/errors/DomainErrors.js";

/**
 * Handler HTTP GET y POST /api/incidents/[id]/supports (Driving Adapter).
 * 
 * GET: Devuelve las estadísticas de apoyos de un reporte (cantidad y si el usuario lo apoyó).
 * POST: Alterna (registra o elimina) el apoyo al reporte por parte del usuario autenticado.
 */
export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // 1. Aplicar políticas CORS
  if (handleCors(request, response)) {
    return;
  }

  // Restringir exclusivamente a GET y POST
  if (request.method !== "GET" && request.method !== "POST") {
    return response.status(405).json({
      error: "Method Not Allowed",
      message: "Este endpoint solo admite peticiones GET y POST.",
    });
  }

  try {
    // 2. Autenticación y obtención de contexto de identidad
    const userContext = getAuthenticatedUser(request);

    // 3. Validar el ID del reporte obtenido de los parámetros de la ruta
    const parseResult = IncidentSupportParamsSchema.safeParse(request.query);
    if (!parseResult.success) {
      console.warn("[Validation Error] ID de reporte inválido en ruta de apoyos:", parseResult.error.issues);
      return response.status(400).json({
        error: "Bad Request",
        message: "El ID del reporte proporcionado en la ruta es inválido.",
        details: parseResult.error.issues.map((err) => ({
          campo: err.path.join("."),
          mensaje: err.message,
        })),
      });
    }

    const { id: reporteId } = parseResult.data;

    // 4. Inyección de dependencias
    const incidentRepository = new DrizzleIncidentRepository();
    const supportRepository = new DrizzleIncidentSupportRepository();

    // 5. Ejecución del caso de uso correspondiente al método HTTP
    if (request.method === "POST") {
      const useCase = new ToggleIncidentSupportUseCase(incidentRepository, supportRepository);
      const isSupported = await useCase.execute({
        usuarioId: userContext.userId,
        reporteId,
      });

      return response.status(200).json({
        message: isSupported
          ? "Apoyo registrado exitosamente."
          : "Apoyo eliminado exitosamente.",
        data: {
          supported: isSupported,
        },
      });
    } else {
      // GET
      const useCase = new GetIncidentSupportsUseCase(incidentRepository, supportRepository);
      const stats = await useCase.execute({
        usuarioId: userContext.userId,
        reporteId,
      });

      return response.status(200).json({
        message: "Estadísticas de apoyos recuperadas exitosamente.",
        data: {
          count: stats.count,
          hasSupported: stats.hasSupported,
        },
      });
    }
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("Falta el contexto de usuario")) {
      console.error("[Security Configuration Error] Cabeceras de middleware ausentes:", error.message);
      return response.status(500).json({
        error: "Internal Server Error",
        message: "Error de configuración de seguridad interna en el servidor.",
      });
    }

    if (error instanceof ReporteNotFoundError) {
      console.warn(`[Incidents Warning] Reporte no encontrado: ${error.message}`);
      return response.status(404).json({
        error: "Not Found",
        message: error.message,
        code: error.code,
      });
    }

    console.error("[Internal Server Error] Error crítico en el endpoint de apoyos:", error);
    return response.status(500).json({
      error: "Internal Server Error",
      message: "Ha ocurrido un error inesperado al procesar la solicitud de apoyos.",
    });
  }
}
