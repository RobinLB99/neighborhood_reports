import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../../../shared-kernel/http/cors.js";
import { getAuthenticatedUser } from "../../../../shared-kernel/http/auth.js";
import { DrizzleIncidentRepository } from "../../../../incidents/infrastructure/database/DrizzleIncidentRepository.js";
import { DrizzleIncidentGestionRepository } from "../../../../incidents/infrastructure/database/DrizzleIncidentGestionRepository.js";
import { RegistrarGestionAdministrativaUseCase } from "../../../../incidents/application/use-cases/RegistrarGestionAdministrativaUseCase.js";
import { ObtenerGestionesPorReporteUseCase } from "../../../../incidents/application/use-cases/ObtenerGestionesPorReporteUseCase.js";
import { CreateGestionParamsSchema, CreateGestionPayloadSchema } from "../../../../incidents/domain/entities/GestionAdministrativa.js";
import { ReporteNotFoundError, InvalidStateTransitionError } from "../../../../shared-kernel/errors/DomainErrors.js";

/**
 * Handler HTTP /api/incidents/[id]/management (Driving Adapter).
 * 
 * POST: Registra una nueva gestión administrativa sobre un reporte de incidencias
 * y actualiza su estado. Restringido a usuarios con rol líder o miembro de la directiva.
 */
export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // 1. Aplicar políticas CORS
  if (handleCors(request, response)) {
    return;
  }

  // Restringir a métodos GET y POST
  if (request.method !== "POST" && request.method !== "GET") {
    return response.status(405).json({
      error: "Method Not Allowed",
      message: "Este endpoint solo admite peticiones GET y POST.",
    });
  }

  try {
    // 2. Autenticación y obtención de contexto de identidad
    const userContext = getAuthenticatedUser(request);

    // Autorización: Solo líderes y miembros de junta directiva
    if (userContext.role !== "lider" && userContext.role !== "miembro") {
      console.warn(`[Security Warning] Usuario con rol '${userContext.role}' intentó acceder al endpoint de gestión administrativa.`);
      return response.status(403).json({
        error: "Forbidden",
        message: "Acceso denegado. Solo los líderes y miembros de la directiva pueden interactuar con las gestiones de los reportes.",
      });
    }

    // 3. Validar el ID del reporte obtenido de los parámetros de la ruta
    const paramsParseResult = CreateGestionParamsSchema.safeParse(request.query);
    if (!paramsParseResult.success) {
      console.warn("[Validation Error] ID de reporte inválido en ruta de gestión:", paramsParseResult.error.issues);
      return response.status(400).json({
        error: "Bad Request",
        message: "El ID del reporte proporcionado en la ruta es inválido.",
        details: paramsParseResult.error.issues.map((err) => ({
          campo: err.path.join("."),
          mensaje: err.message,
        })),
      });
    }

    const { id: reporteId } = paramsParseResult.data;

    // 4. Inyección de dependencias
    const incidentRepository = new DrizzleIncidentRepository();
    const incidentGestionRepository = new DrizzleIncidentGestionRepository();

    // 5. Bifurcar según método HTTP
    if (request.method === "GET") {
      const obtenerGestionesUseCase = new ObtenerGestionesPorReporteUseCase(
        incidentRepository,
        incidentGestionRepository
      );

      const gestiones = await obtenerGestionesUseCase.execute({ reporteId });

      return response.status(200).json({
        message: "Gestiones del reporte recuperadas exitosamente.",
        data: gestiones.map((g) => ({
          id: g.id,
          reporteId: g.reporteId,
          liderId: g.liderId,
          nombreLider: g.nombreLider,
          estadoAsignado: g.estadoAsignado,
          mensaje: g.mensaje,
          fechaGestion: g.fechaGestion,
        })),
      });
    }

    // Método POST
    // Validar el body de la petición
    const bodyParseResult = CreateGestionPayloadSchema.safeParse(request.body);
    if (!bodyParseResult.success) {
      console.warn("[Validation Error] Payload de gestión inválido:", bodyParseResult.error.issues);
      return response.status(400).json({
        error: "Bad Request",
        message: "Los datos de la gestión proporcionados son inválidos.",
        details: bodyParseResult.error.issues.map((err) => ({
          campo: err.path.join("."),
          mensaje: err.message,
        })),
      });
    }

    const { estadoAsignado, mensaje } = bodyParseResult.data;

    const registrarGestionUseCase = new RegistrarGestionAdministrativaUseCase(
      incidentRepository,
      incidentGestionRepository
    );

    const gestion = await registrarGestionUseCase.execute({
      reporteId,
      liderId: userContext.userId,
      estadoAsignado,
      mensaje,
    });

    return response.status(201).json({
      message: "Gestión administrativa registrada y estado de reporte actualizado exitosamente.",
      data: {
        id: gestion.id,
        reporteId: gestion.reporteId,
        liderId: gestion.liderId,
        estadoAsignado: gestion.estadoAsignado,
        mensaje: gestion.mensaje,
        fechaGestion: gestion.fechaGestion,
      },
    });
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("Falta el contexto de usuario")) {
      console.error("[Security Configuration Error] Cabeceras de middleware ausentes:", error.message);
      return response.status(500).json({
        error: "Internal Server Error",
        message: "Error de configuración de seguridad interna en el servidor.",
      });
    }

    if (error instanceof ReporteNotFoundError) {
      console.warn(`[Incidents Warning] Reporte no encontrado para gestión: ${error.message}`);
      return response.status(404).json({
        error: "Not Found",
        message: error.message,
        code: error.code,
      });
    }

    if (error instanceof InvalidStateTransitionError) {
      console.warn(`[Incidents Warning] Intento de transición de estado inválido: ${error.message}`);
      return response.status(400).json({
        error: "Bad Request",
        message: error.message,
        code: error.code,
      });
    }

    console.error("[Internal Server Error] Error crítico en el endpoint de gestión administrativa:", error);
    return response.status(500).json({
      error: "Internal Server Error",
      message: "Ha ocurrido un error inesperado al procesar la solicitud.",
    });
  }
}
