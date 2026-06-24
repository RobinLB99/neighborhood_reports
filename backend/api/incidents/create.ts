import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../src/shared-kernel/http/cors.js";
import { getAuthenticatedUser } from "../../src/shared-kernel/http/auth.js";
import { CreateReportPayloadSchema } from "../../src/incidents/domain/entities/Reporte.js";
import { DrizzleIncidentRepository } from "../../src/incidents/infrastructure/database/DrizzleIncidentRepository.js";
import { CreateReportUseCase } from "../../src/incidents/application/use-cases/CreateReportUseCase.js";

/**
 * Handler HTTP POST /api/incidents/create (Driving Adapter).
 * 
 * Permite a cualquier ciudadano autenticado reportar una nueva incidencia
 * en su respectivo barrio, validando rigurosamente los campos del reporte.
 * 
 * @param request Petición entrante del cliente con los campos del reporte en el body.
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
    // 2. Autenticación y obtención de contexto de identidad
    const userContext = getAuthenticatedUser(request);

    // 3. Validación de contrato del cuerpo del Request con Zod
    const result = CreateReportPayloadSchema.safeParse(request.body);

    if (!result.success) {
      console.warn(
        `[Validation Warning] Error al validar payload de creación de reporte por el usuario ${userContext.userId}:`,
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

    // 4. Inyección manual de dependencias
    const repository = new DrizzleIncidentRepository();
    const useCase = new CreateReportUseCase(repository);

    // 5. Ejecución del flujo de negocio
    const createdReport = await useCase.execute({
      usuarioId: userContext.userId,
      barrioId: userContext.barrioId,
      direccion: result.data.direccion,
      ubicacion: result.data.ubicacion,
      fotoUrl: result.data.fotoUrl,
      descripcion: result.data.descripcion,
    });

    console.info(`[Success] Reporte de incidencia ID ${createdReport.id} creado con éxito por el usuario ${userContext.userId}.`);

    return response.status(201).json({
      message: "Reporte de incidencia registrado exitosamente.",
      data: {
        id: createdReport.id,
        usuarioId: createdReport.usuarioId,
        barrioId: createdReport.barrioId,
        direccion: createdReport.direccion,
        ubicacion: createdReport.ubicacion,
        fotoUrl: createdReport.fotoUrl,
        estado: createdReport.estado,
        descripcion: createdReport.descripcion,
        fechaCreacion: createdReport.fechaCreacion,
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

    console.error("[Internal Server Error] Error crítico al crear el reporte de incidencia:", error);
    return response.status(500).json({
      error: "Internal Server Error",
      message: "Ha ocurrido un error inesperado al registrar el reporte.",
    });
  }
}
