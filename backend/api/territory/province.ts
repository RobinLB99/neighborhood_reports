import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../src/shared-kernel/http/cors.js";
import { DrizzleTerritoryRepository } from "../../src/territory/infrastructure/database/DrizzleTerritoryRepository.js";
import { GetProvincesUseCase } from "../../src/territory/application/use-cases/GetProvincesUseCase.js";

/**
 * Handler HTTP GET /api/territory/province (Driving Adapter).
 * 
 * Devuelve el catálogo completo de provincias registradas en el sistema.
 * 
 * Flujo:
 * 1. Resuelve CORS.
 * 2. Valida método GET.
 * 3. Inyecta dependencias manualmente al caso de uso.
 * 4. Obtiene el catálogo e inyecta headers de caché HTTP para mitigar cold starts y base de datos.
 */
export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (handleCors(request, response)) {
    return;
  }

  if (request.method !== "GET") {
    return response.status(405).json({
      error: "Method Not Allowed",
      message: "Este endpoint solo admite peticiones GET.",
    });
  }

  try {
    const repository = new DrizzleTerritoryRepository();
    const useCase = new GetProvincesUseCase(repository);

    const provinces = await useCase.execute();

    // Caché HTTP agresiva para serverless (CDN cache: 24 horas, Browser cache: 1 hora)
    response.setHeader(
      "Cache-Control",
      "public, max-age=3600, s-maxage=86400, stale-while-revalidate=600"
    );

    return response.status(200).json({
      message: "Provincias recuperadas con éxito.",
      data: provinces,
    });
  } catch (error) {
    console.error("[Internal Server Error] Error al recuperar provincias:", error);
    return response.status(500).json({
      error: "Internal Server Error",
      message: "Ha ocurrido un error inesperado en el servidor.",
    });
  }
}
