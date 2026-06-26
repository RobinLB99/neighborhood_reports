import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../../../shared-kernel/http/cors.js";
import { DrizzleTerritoryRepository } from "../../../../territory/infrastructure/database/DrizzleTerritoryRepository.js";
import { GetCitiesByProvinceUseCase } from "../../../../territory/application/use-cases/GetCitiesByProvinceUseCase.js";
import { GetCitiesSchema } from "../../../../territory/application/dtos/GetCitiesDto.js";
import { ProvinceNotFoundError } from "../../../../shared-kernel/errors/DomainErrors.js";

/**
 * Handler HTTP GET /api/territory/city (Driving Adapter).
 * 
 * Devuelve el catálogo de ciudades asociadas a una provincia especificada por query parameter.
 * 
 * Flujo:
 * 1. Resuelve CORS.
 * 2. Valida método GET.
 * 3. Valida y sanitiza el query parameter `provinceId` usando Zod.
 * 4. Inyecta dependencias manualmente al caso de uso.
 * 5. Obtiene el catálogo e inyecta headers de caché HTTP.
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
    const result = GetCitiesSchema.safeParse(request.query);

    if (!result.success) {
      console.warn("[Validation Error] Fallo al validar query params de ciudades:", result.error.issues);
      return response.status(400).json({
        error: "Bad Request",
        message: "El parámetro de consulta 'provinceId' es requerido y debe ser un número válido.",
        details: result.error.issues.map((err) => ({
          campo: err.path.join("."),
          mensaje: err.message,
        })),
      });
    }

    const repository = new DrizzleTerritoryRepository();
    const useCase = new GetCitiesByProvinceUseCase(repository);

    const cities = await useCase.execute(result.data);

    // Caché HTTP agresiva para serverless (CDN cache: 24 horas, Browser cache: 1 hora)
    response.setHeader(
      "Cache-Control",
      "public, max-age=3600, s-maxage=86400, stale-while-revalidate=600"
    );

    return response.status(200).json({
      message: "Ciudades recuperadas con éxito.",
      data: cities,
    });
  } catch (error) {
    if (error instanceof ProvinceNotFoundError) {
      console.warn(`[Territory Warning] Provincia no encontrada: ${error.message}`);
      return response.status(404).json({
        error: "Not Found",
        message: error.message,
        code: error.code,
      });
    }

    console.error("[Internal Server Error] Error al recuperar ciudades:", error);
    return response.status(500).json({
      error: "Internal Server Error",
      message: "Ha ocurrido un error inesperado en el servidor.",
    });
  }
}
