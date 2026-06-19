import type { VercelRequest, VercelResponse } from "@vercel/node";

// Lista de orígenes permitidos (configurable en producción mediante variables de entorno)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:4321", "http://localhost:3000"];

/**
 * Orquestador de políticas CORS a nivel de infraestructura HTTP.
 *
 * Implementa la validación dinámica de orígenes requerida por el estándar W3C
 * para permitir la coexistencia de credenciales seguras (cookies/tokens) y
 * control dinámico de acceso por dominios sin incurrir en acoplamientos rígidos (vendor lock-in).
 *
 * @param req Objeto VercelRequest del Driving Adapter
 * @param res Objeto VercelResponse del Driving Adapter
 * @returns boolean 'true' si es una petición Preflight (OPTIONS) manejada y finalizada, 'false' en otro caso.
 */
export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin;

  // Si la petición no especifica cabecera origin (llamadas directas curl/postman/servicios internos)
  if (!origin) {
    return false;
  }

  // Validación de seguridad para determinar si el origen está explícitamente permitido o es desarrollo local
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV === "development";

  if (isAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,OPTIONS,PATCH,DELETE,POST,PUT",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
    );
  }

  // Intercepción centralizada del protocolo Preflight (peticiones OPTIONS emitidas por navegadores)
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true; // Petición preflight interceptada y resuelta con éxito
  }

  return false; // Flujo estándar para continuar la ejecución del endpoint
}
