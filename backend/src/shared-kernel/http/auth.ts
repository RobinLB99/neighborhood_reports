import type { VercelRequest } from '@vercel/node';

/**
 * Contexto de identidad de un usuario autenticado por el Edge Middleware.
 */
export interface UserContext {
  /** Identificador único numérico del usuario. */
  readonly userId: number;
  /** Rol del usuario (vecino, líder, etc.) inyectado por seguridad. */
  readonly role: string;
  /** Identificador del barrio asociado a la cuenta de usuario. */
  readonly barrioId: number;
}

/**
 * Helper de extracción segura de identidad.
 * 
 * Recupera el contexto de identidad previamente verificado e inyectado
 * en las cabeceras HTTP por el Edge Middleware.
 * 
 * @param request Petición HTTP recibida por el handler del Driving Adapter.
 * @returns UserContext estructurado y verificado.
 * @throws Error si alguna de las cabeceras requeridas (`x-user-id`, `x-user-role`, `x-user-barrio-id`) no está presente o es corrupta.
 */
export function getAuthenticatedUser(request: VercelRequest): UserContext {
  const userIdStr = request.headers['x-user-id'];
  const role = request.headers['x-user-role'];
  const barrioIdStr = request.headers['x-user-barrio-id'];

  if (!userIdStr || !role || !barrioIdStr) {
    throw new Error(
      'Falta el contexto de usuario en las cabeceras HTTP. ' +
      'Asegúrese de que el endpoint no esté configurado como público por error en middleware.ts.'
    );
  }

  const userId = parseInt(userIdStr as string, 10);
  const barrioId = parseInt(barrioIdStr as string, 10);

  if (isNaN(userId) || isNaN(barrioId)) {
    throw new Error('El contexto de usuario contiene identificadores no numéricos corruptos.');
  }

  return {
    userId,
    role: role as string,
    barrioId,
  };
}
