import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../../src/shared-kernel/http/cors.js";
import { getAuthenticatedUser } from "../../../src/shared-kernel/http/auth.js";
import { DrizzleIncidentRepository } from "../../../src/incidents/infrastructure/database/DrizzleIncidentRepository.js";
import { DrizzleIncidentCommentRepository } from "../../../src/incidents/infrastructure/database/DrizzleIncidentCommentRepository.js";
import { AddCommentToIncidentUseCase } from "../../../src/incidents/application/use-cases/AddCommentToIncidentUseCase.js";
import { GetIncidentCommentsUseCase } from "../../../src/incidents/application/use-cases/GetIncidentCommentsUseCase.js";
import { AddCommentParamsSchema, CreateCommentPayloadSchema } from "../../../src/incidents/domain/entities/Comentario.js";
import { ReporteNotFoundError } from "../../../src/shared-kernel/errors/DomainErrors.js";

/**
 * Handler HTTP /api/incidents/[id]/comments (Driving Adapter).
 * 
 * POST: Registra un comentario en el reporte por parte del usuario autenticado.
 * GET: Recupera los comentarios asociados a un reporte específico. Restringido a líder y miembro.
 */
export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // 1. Aplicar políticas CORS
  if (handleCors(request, response)) {
    return;
  }

  // Restringir a GET y POST
  if (request.method !== "POST" && request.method !== "GET") {
    return response.status(405).json({
      error: "Method Not Allowed",
      message: "Este endpoint solo admite peticiones GET y POST.",
    });
  }

  try {
    // 2. Autenticación y obtención de contexto de identidad
    const userContext = getAuthenticatedUser(request);

    // 3. Validar el ID del reporte obtenido de los parámetros de la ruta
    const paramsParseResult = AddCommentParamsSchema.safeParse(request.query);
    if (!paramsParseResult.success) {
      console.warn("[Validation Error] ID de reporte inválido en ruta de comentarios:", paramsParseResult.error.issues);
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
    const commentRepository = new DrizzleIncidentCommentRepository();

    // 5. Bifurcar según método HTTP
    if (request.method === "GET") {
      // Autorización: Solo líderes y miembros
      if (userContext.role !== "lider" && userContext.role !== "miembro") {
        console.warn(`[Security Warning] Usuario con rol '${userContext.role}' intentó leer comentarios del reporte ${reporteId}.`);
        return response.status(403).json({
          error: "Forbidden",
          message: "Acceso denegado. Solo los líderes y miembros de comités pueden recuperar los comentarios.",
        });
      }

      const getCommentsUseCase = new GetIncidentCommentsUseCase(incidentRepository, commentRepository);
      const comments = await getCommentsUseCase.execute({ reporteId });

      return response.status(200).json({
        message: "Comentarios recuperados exitosamente.",
        data: comments.map((comment) => ({
          id: comment.id,
          reporteId: comment.reporteId,
          usuarioId: comment.usuarioId,
          mensaje: comment.mensaje,
          fechaCreacion: comment.fechaCreacion,
        })),
      });
    }

    // Método POST
    // Validar el body de la petición
    const bodyParseResult = CreateCommentPayloadSchema.safeParse(request.body);
    if (!bodyParseResult.success) {
      console.warn("[Validation Error] Payload de comentario inválido:", bodyParseResult.error.issues);
      return response.status(400).json({
        error: "Bad Request",
        message: "El contenido del comentario proporcionado es inválido.",
        details: bodyParseResult.error.issues.map((err) => ({
          campo: err.path.join("."),
          mensaje: err.message,
        })),
      });
    }

    const { mensaje } = bodyParseResult.data;

    // Ejecución del caso de uso
    const addCommentUseCase = new AddCommentToIncidentUseCase(incidentRepository, commentRepository);
    const comment = await addCommentUseCase.execute({
      usuarioId: userContext.userId,
      reporteId,
      mensaje,
    });

    return response.status(201).json({
      message: "Comentario registrado exitosamente.",
      data: {
        id: comment.id,
        reporteId: comment.reporteId,
        usuarioId: comment.usuarioId,
        mensaje: comment.mensaje,
        fechaCreacion: comment.fechaCreacion,
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
      console.warn(`[Incidents Warning] Reporte no encontrado: ${error.message}`);
      return response.status(404).json({
        error: "Not Found",
        message: error.message,
        code: error.code,
      });
    }

    console.error("[Internal Server Error] Error crítico en el endpoint de comentarios:", error);
    return response.status(500).json({
      error: "Internal Server Error",
      message: "Ha ocurrido un error inesperado al procesar la solicitud.",
    });
  }
}
