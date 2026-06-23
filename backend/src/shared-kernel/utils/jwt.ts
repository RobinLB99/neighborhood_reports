import { SignJWT } from "jose";

export interface JwtPayload {
  readonly sub: string;
  readonly rol: string;
  readonly barrioId: number;
}

/**
 * Firma un token JWT utilizando el secreto configurado en el entorno.
 * Es compatible con Edge y Serverless gracias a la librería jose.
 */
export async function generateJwt(
  payload: JwtPayload,
  expiresIn: string = "7d"
): Promise<string> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "La variable de entorno JWT_SECRET no está configurada. " +
      "Por favor asegúrese de definirla en su archivo .env."
    );
  }

  const secretKey = new TextEncoder().encode(secret);
  
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}
