import { next } from "@vercel/edge";
import { jwtVerify } from "jose";

/**
 * Vercel Edge Middleware - Filtro Global de Seguridad con soporte CORS.
 */
const PUBLIC_PATHS = [
    "/api/health",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/register-leader",
    "/api/territory/province",
    "/api/territory/city",
    "/api/territory/neighborhood",
];

export default async function middleware(request: Request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const origin = request.headers.get("origin") || "*";

    // Cabeceras CORS estándar para reutilizar tanto en errores como en respuestas preflight
    const corsHeaders = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods":
            "GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
            "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Allow-Credentials": "true",
    };

    // 1. Interceptar e Interrumpir peticiones preflight CORS (OPTIONS) directamente en el Edge
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 200,
            headers: corsHeaders,
        });
    }

    // 2. Omitir validación de JWT para rutas públicas conocidas
    if (
        PUBLIC_PATHS.some(
            (path) => pathname === path || pathname.startsWith(path + "/"),
        )
    ) {
        return next();
    }

    // 3. Extraer y validar la cabecera de Autorización
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(
            JSON.stringify({
                error: "Unauthorized",
                message:
                    "Token de acceso no proporcionado o formato inválido. Debe utilizar Bearer <token>.",
            }),
            {
                status: 401,
                headers: { ...corsHeaders, "content-type": "application/json" }, // 👈 CORS agregado a errores
            },
        );
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return new Response(
            JSON.stringify({
                error: "Unauthorized",
                message:
                    "Formato de token inválido o vacío después del prefijo Bearer.",
            }),
            {
                status: 401,
                headers: { ...corsHeaders, "content-type": "application/json" }, // 👈 CORS agregado a errores
            },
        );
    }

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error(
                "[Security Critical] JWT_SECRET no está configurada en las variables de entorno.",
            );
            return new Response(
                JSON.stringify({
                    error: "Internal Server Error",
                    message:
                        "Error de configuración de seguridad interna en el servidor.",
                }),
                {
                    status: 500,
                    headers: {
                        ...corsHeaders,
                        "content-type": "application/json",
                    },
                },
            );
        }

        const secretKey = new TextEncoder().encode(secret);
        const { payload } = await jwtVerify(token, secretKey);

        // 4. Clonar headers e inyectar contexto de identidad para los Handlers downstream
        const requestHeaders = new Headers(request.headers);

        if (payload.sub) {
            requestHeaders.set("x-user-id", payload.sub);
        }
        if (typeof payload.rol === "string") {
            requestHeaders.set("x-user-role", payload.rol);
        }
        if (payload.barrioId !== undefined) {
            requestHeaders.set("x-user-barrio-id", String(payload.barrioId));
        }

        // 5. Continuar la cadena de ejecución inyectando las nuevas cabeceras
        return next({
            request: {
                headers: requestHeaders,
            },
        });
    } catch (error) {
        console.warn(
            "[Security Warn] Intento de acceso denegado por token inválido/expirado:",
            error,
        );
        return new Response(
            JSON.stringify({
                error: "Unauthorized",
                message:
                    "Token de acceso expirado, inválido o con formato corrupto.",
            }),
            {
                status: 401,
                headers: { ...corsHeaders, "content-type": "application/json" }, // 👈 CORS agregado a errores
            },
        );
    }
}
