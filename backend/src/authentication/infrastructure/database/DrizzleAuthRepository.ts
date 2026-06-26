import { eq, and } from "drizzle-orm";
import { db } from "../../../shared-kernel/database/drizzle.js";
import { User } from "../../domain/entities/User.js";
import type { AuthRepository } from "../../domain/repositories/AuthRepository.interface.js";
import { usuarios } from "./schema.js";
import { UsernameAlreadyTakenError, BarrioNotFoundError } from "../../../shared-kernel/errors/DomainErrors.js";

export class DrizzleAuthRepository implements AuthRepository {
  /**
   * Busca un usuario en la base de datos por su nombre de usuario.
   */
  async findByUsername(usuario: string): Promise<User | null> {
    const rows = await db
      .select({
        id: usuarios.id,
        barrioId: usuarios.barrioId,
        nombre: usuarios.nombre,
        usuario: usuarios.usuario,
        contrasenaHash: usuarios.contrasenaHash,
        fechaRegistro: usuarios.fechaRegistro,
        rol: usuarios.rol,
      })
      .from(usuarios)
      .where(eq(usuarios.usuario, usuario))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    if (!row) {
      return null;
    }

    return new User(
      row.id,
      row.barrioId,
      row.nombre,
      row.usuario,
      row.contrasenaHash,
      row.rol,
      row.fechaRegistro ?? undefined
    );
  }

  /**
   * Busca un usuario en la base de datos por su ID único.
   */
  async findById(id: number): Promise<User | null> {
    const rows = await db
      .select({
        id: usuarios.id,
        barrioId: usuarios.barrioId,
        nombre: usuarios.nombre,
        usuario: usuarios.usuario,
        contrasenaHash: usuarios.contrasenaHash,
        fechaRegistro: usuarios.fechaRegistro,
        rol: usuarios.rol,
      })
      .from(usuarios)
      .where(eq(usuarios.id, id))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    if (!row) {
      return null;
    }

    return new User(
      row.id,
      row.barrioId,
      row.nombre,
      row.usuario,
      row.contrasenaHash,
      row.rol,
      row.fechaRegistro ?? undefined
    );
  }

  /**
   * Registra un nuevo usuario en la base de datos.
   */
  async register(user: User): Promise<User> {
    try {
      return await db.transaction(async (tx) => {
        const validRoles = ["lider", "miembro", "ciudadano"] as const;
        const mappedRole = user.rol.toLowerCase() as "lider" | "miembro" | "ciudadano";
        
        if (!validRoles.includes(mappedRole)) {
          throw new Error(`El rol '${user.rol}' no se encuentra configurado en el sistema.`);
        }

        const [insertedUser] = await tx
          .insert(usuarios)
          .values({
            nombre: user.nombre,
            usuario: user.usuario,
            contrasenaHash: user.contrasenaHash,
            barrioId: user.barrioId,
            rol: mappedRole,
          })
          .returning();

        if (!insertedUser) {
          throw new Error("No se pudo registrar el usuario.");
        }

        return new User(
          insertedUser.id,
          insertedUser.barrioId,
          insertedUser.nombre,
          insertedUser.usuario,
          insertedUser.contrasenaHash,
          insertedUser.rol,
          insertedUser.fechaRegistro ?? undefined
        );
      });
    } catch (error: any) {
      if (error && typeof error === "object") {
        const code = error.code || (error.rawError && error.rawError.code);
        const detail = error.detail || "";
        const message = error.message || "";

        if (code === "23505") {
          if (message.includes("usuarios_usuario_unique") || detail.includes("usuario") || message.includes("usuario")) {
            throw new UsernameAlreadyTakenError(user.usuario);
          }
        }

        if (code === "23503") {
          if (message.includes("barrio_id") || detail.includes("barrio_id")) {
            throw new BarrioNotFoundError(user.barrioId);
          }
        }
      }
      throw error;
    }
  }

  /**
   * Actualiza el rol de un usuario en el sistema.
   */
  async updateUserRole(userId: number, roleName: string): Promise<void> {
    const validRoles = ["lider", "miembro", "ciudadano"] as const;
    const mappedRole = roleName.toLowerCase() as "lider" | "miembro" | "ciudadano";

    if (!validRoles.includes(mappedRole)) {
      throw new Error(`El rol '${roleName}' no se encuentra configurado en el sistema.`);
    }

    await db
      .update(usuarios)
      .set({ rol: mappedRole })
      .where(eq(usuarios.id, userId));
  }

  /**
   * Busca vecinos de un barrio que sean elegibles para formar parte del comité.
   * Filtra por barrio y asegura que el rol sea "ciudadano".
   */
  async findEligibleNeighborsByBarrio(barrioId: number): Promise<User[]> {
    const rows = await db
      .select({
        id: usuarios.id,
        barrioId: usuarios.barrioId,
        nombre: usuarios.nombre,
        usuario: usuarios.usuario,
        contrasenaHash: usuarios.contrasenaHash,
        fechaRegistro: usuarios.fechaRegistro,
        rol: usuarios.rol,
      })
      .from(usuarios)
      .where(
        and(
          eq(usuarios.barrioId, barrioId),
          eq(usuarios.rol, "ciudadano")
        )
      );

    return rows.map(
      (row) =>
        new User(
          row.id,
          row.barrioId,
          row.nombre,
          row.usuario,
          row.contrasenaHash,
          row.rol,
          row.fechaRegistro ?? undefined
        )
    );
  }
}



