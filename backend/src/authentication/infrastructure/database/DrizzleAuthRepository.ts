import { eq } from "drizzle-orm";
import { db } from "../../../shared-kernel/database/drizzle.js";
import { User } from "../../domain/entities/User.js";
import type { AuthRepository } from "../../domain/repositories/AuthRepository.interface.js";
import { usuarios } from "./schema.js";

export class DrizzleAuthRepository implements AuthRepository {
  /**
   * Busca un usuario en la base de datos por su nombre de usuario.
   */
  async findByUsername(usuario: string): Promise<User | null> {
    const [row] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.usuario, usuario))
      .limit(1);

    if (!row) {
      return null;
    }

    return new User(
      row.id,
      row.barrioId,
      row.nombre,
      row.usuario,
      row.contrasenaHash,
      row.rol ?? "Vecino",
      row.fechaRegistro ?? undefined
    );
  }

  /**
   * Busca un usuario en la base de datos por su ID único.
   */
  async findById(id: number): Promise<User | null> {
    const [row] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    return new User(
      row.id,
      row.barrioId,
      row.nombre,
      row.usuario,
      row.contrasenaHash,
      row.rol ?? "Vecino",
      row.fechaRegistro ?? undefined
    );
  }
}
