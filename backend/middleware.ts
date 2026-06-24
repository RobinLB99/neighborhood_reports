import { next } from '@vercel/edge';
import { jwtVerify } from 'jose';

/**
 * Vercel Edge Middleware - Filtro Global de Seguridad.
 * 
 * Se ejecuta en la red global distribuida de Vercel (Edge Runtime).
 * Intercepta las solicitudes entrantes antes de que alcancen las funciones serverless de Node.js.
 * 
 * Responsabilidades:
 * 1. Omitir validación para rutas públicas declaradas en `PUBLIC_PATHS`.
 * 2. Extraer y validar firmas JWT en la cabecera `Authorization: Bearer <token>`.
 * 3. En caso de token válido, inyectar el contexto de identidad (`x-user-id`, `x-user-role`, `x-user-barrio-id`)
 *    en las cabeceras HTTP de la petición que se propaga a los controladores (downstream handlers).
 * 4. Retornar respuestas rápidas 401 sin incurrir en latencias de base de datos ni tiempos de cold start del backend.
 */
const PUBLIC_PATHS = [
    "/api/health",
    "/api/committee/register-first",
    "/api/auth/login",
    "/api/auth/register",
    "/api/territory/province",
    "/api/territory/city",
    "/api/territory/neighborhood",
];

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Dejar pasar preflight CORS — OPTIONS nunca lleva Authorization header
  if (request.method === 'OPTIONS') {
    return next();
  }

  // 1. Omitir validación para rutas públicas conocidas
  if (PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return next();
  }

  // 2. Extraer y validar la cabecera de Autorización
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Token de acceso no proporcionado o formato inválido. Debe utilizar Bearer <token>.',
      }),
      {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[Security Critical] JWT_SECRET no está configurada en las variables de entorno.');
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'Error de configuración de seguridad interna en el servidor.',
        }),
        {
          status: 500,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    // 3. Verificar la validez del token en el Edge (sin latencia de base de datos)
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);

    // 4. Clonar headers e inyectar contexto de identidad para los Handlers downstream
    const requestHeaders = new Headers(request.headers);

    if (payload.sub) {
      requestHeaders.set('x-user-id', payload.sub);
    }
    if (typeof payload.rol === 'string') {
      requestHeaders.set('x-user-role', payload.rol);
    }
    if (payload.barrioId !== undefined) {
      requestHeaders.set('x-user-barrio-id', String(payload.barrioId));
    }

    // 5. Continuar la cadena de ejecución inyectando las nuevas cabeceras
    return next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.warn('[Security Warn] Intento de acceso denegado por token inválido/expirado:', error);
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Token de acceso expirado, inválido o con formato corrupto.',
      }),
      {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
}
