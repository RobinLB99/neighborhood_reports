import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../../../../shared-kernel/http/cors.js";
import { getAuthenticatedUser } from "../../../../../shared-kernel/http/auth.js";
import { CloudinaryImageUploader } from "../../../../../shared-kernel/storage/infrastructure/CloudinaryImageUploader.js";

/**
 * Handler HTTP GET /api/storage/signature (Driving Adapter).
 * 
 * Genera una firma criptográfica (Signed Upload) para que el frontend pueda
 * subir imágenes pesadas directamente a Cloudinary, mitigando los límites de
 * payload de Vercel Serverless Functions.
 * 
 * Requiere autenticación JWT válida.
 * 
 * @param request Petición entrante del cliente con credenciales JWT en cabeceras.
 * @param response Respuesta HTTP emitida hacia el cliente con la firma y metadatos.
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
    // getAuthenticatedUser lanzará error si el token no está presente o es inválido.
    const userContext = getAuthenticatedUser(request);

    console.info(`[Storage Signature] Solicitud de firma iniciada por el usuario: ${userContext.userId} para el barrio: ${userContext.barrioId}`);

    // 3. Extraer y sanitizar parámetros
    const requestedFolder = request.query.folder;
    const folder = typeof requestedFolder === "string" ? requestedFolder.trim() : "reportes";

    // 4. Instanciación del adaptador de Cloudinary
    const uploader = new CloudinaryImageUploader();

    // 5. Generación de firma criptográfica
    const signatureData = uploader.generateSignature(folder);

    console.info(`[Storage Signature] Firma generada exitosamente para la carpeta: '${folder}'`);

    return response.status(200).json({
      message: "Firma de Cloudinary generada exitosamente.",
      data: signatureData,
    });
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("Falta el contexto de usuario")) {
      console.error("[Security Configuration Error] Cabeceras de middleware ausentes:", error.message);
      return response.status(500).json({
        error: "Internal Server Error",
        message: "Error de configuración de seguridad interna en el servidor.",
      });
    }

    console.error("[Internal Server Error] Error crítico al generar firma de almacenamiento:", error);
    return response.status(500).json({
      error: "Internal Server Error",
      message: "Ha ocurrido un error inesperado en el servidor.",
    });
  }
}
