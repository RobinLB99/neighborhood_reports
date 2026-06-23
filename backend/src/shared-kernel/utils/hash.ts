import { scryptSync, randomBytes } from "crypto";

/**
 * Genera un hash seguro para una contraseña usando scrypt nativo de Node.js.
 * Ideal para entornos Serverless debido a que no añade peso de dependencias de node_modules.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hashedPassword = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hashedPassword}`;
}

/**
 * Verifica si una contraseña coincide con el hash almacenado en la base de datos.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 2) {
    return false;
  }
  const salt = parts[0];
  const hash = parts[1];
  if (!salt || !hash) {
    return false;
  }
  const hashToCompare = scryptSync(password, salt, 64).toString("hex");
  return hash === hashToCompare;
}

