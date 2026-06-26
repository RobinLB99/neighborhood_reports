import { eq } from "drizzle-orm";
import { db } from "../../../shared-kernel/database/drizzle.js";
import { Committee } from "../../domain/entities/Committee.js";
import { CommitteeMember } from "../../domain/entities/CommitteeMember.js";
import { User } from "../../../authentication/domain/entities/User.js";
import type { CommitteeRepository } from "../../domain/repositories/CommitteeRepository.interface.js";
import { comites, miembrosComite } from "./schema.js";
import { usuarios } from "../../../authentication/infrastructure/database/schema.js";
import {
  CommitteeAlreadyExistsError,
  BarrioNotFoundError,
  UsernameAlreadyTakenError,
  UserAlreadyInCommitteeError,
} from "../../../shared-kernel/errors/DomainErrors.js";

export class DrizzleCommitteeRepository implements CommitteeRepository {
  async registerFirstMember(
    committee: Committee,
    user: User,
    member: CommitteeMember
  ): Promise<{
    committeeId: number;
    usuarioId: number;
    miembroId: number;
  }> {
    try {
      return await db.transaction(async (tx) => {
        // 1. Insertamos el usuario líder con rol 'lider'
        const [insertedUser] = await tx
          .insert(usuarios)
          .values({
            nombre: user.nombre,
            usuario: user.usuario,
            contrasenaHash: user.contrasenaHash,
            barrioId: user.barrioId,
            rol: "lider",
          })
          .returning({ id: usuarios.id });

        if (!insertedUser) {
          throw new Error("No se pudo registrar el usuario líder.");
        }

        // 2. Intentamos crear el comité barrial.
        // Si ya existe uno para este barrioId, fallará con Unique Constraint Violation.
        const [insertedCommittee] = await tx
          .insert(comites)
          .values({
            barrioId: committee.barrioId,
          })
          .returning({ id: comites.id });

        if (!insertedCommittee) {
          throw new Error("No se pudo insertar el comité barrial.");
        }

        // 3. Asignamos al usuario como miembro y presidente en miembrosComite.
        const [insertedMember] = await tx
          .insert(miembrosComite)
          .values({
            comiteId: insertedCommittee.id,
            usuarioId: insertedUser.id,
            rol: member.rol, // 'Presidente'
          })
          .returning({ id: miembrosComite.id });

        if (!insertedMember) {
          throw new Error("No se pudo asignar el usuario fundador como miembro del comité.");
        }

        return {
          committeeId: insertedCommittee.id,
          usuarioId: insertedUser.id,
          miembroId: insertedMember.id,
        };
      });
    } catch (error: any) {
      // Manejo de errores específicos de PostgreSQL
      if (error && typeof error === "object") {
        const code = error.code || (error.rawError && error.rawError.code);
        const detail = error.detail || "";
        const message = error.message || "";

        // Código de error Postgres 23505: Violación de índice único
        if (code === "23505") {
          // Si es violación del usuario (usuario único)
          if (message.includes("usuarios_usuario_unique") || detail.includes("usuario") || message.includes("usuario")) {
            throw new UsernameAlreadyTakenError(user.usuario);
          }
          // Si es violación del comité (barrio único)
          if (message.includes("comites_barrio_id_unique") || detail.includes("barrio_id") || message.includes("barrio_id")) {
            throw new CommitteeAlreadyExistsError(committee.barrioId);
          }
        }

        // Código de error Postgres 23503: Violación de clave foránea (FK)
        if (code === "23503") {
          if (message.includes("barrio_id") || detail.includes("barrio_id")) {
            throw new BarrioNotFoundError(committee.barrioId);
          }
        }
      }

      // Si es otro error de base de datos o de runtime, se relanza
      throw error;
    }
  }

  async getByBarrioId(barrioId: number): Promise<Committee | null> {
    const [row] = await db
      .select()
      .from(comites)
      .where(eq(comites.barrioId, barrioId))
      .limit(1);

    if (!row) {
      return null;
    }

    return new Committee(row.id, row.barrioId, row.fechaCreacion ?? undefined);
  }

  async registerMember(
    userId: number,
    member: CommitteeMember
  ): Promise<{
    miembroId: number;
  }> {
    try {
      return await db.transaction(async (tx) => {
        // 1. Actualizar el rol del usuario a 'miembro'
        const [updatedUser] = await tx
          .update(usuarios)
          .set({ rol: "miembro" })
          .where(eq(usuarios.id, userId))
          .returning({ id: usuarios.id });

        if (!updatedUser) {
          throw new Error("No se pudo actualizar el rol del usuario.");
        }

        // 2. Asignamos al usuario como miembro en miembrosComite.
        const [insertedMember] = await tx
          .insert(miembrosComite)
          .values({
            comiteId: member.comiteId!,
            usuarioId: userId,
            rol: member.rol,
          })
          .returning({ id: miembrosComite.id });

        if (!insertedMember) {
          throw new Error("No se pudo asignar el usuario como miembro del comité.");
        }

        return {
          miembroId: insertedMember.id,
        };
      });
    } catch (error: any) {
      // Manejo de errores específicos de PostgreSQL
      if (error && typeof error === "object") {
        const code = error.code || (error.rawError && error.rawError.code);
        const detail = error.detail || "";
        const message = error.message || "";

        // Código de error Postgres 23505: Violación de índice único
        if (code === "23505") {
          if (message.includes("miembros_comite_usuario_id_unique") || detail.includes("usuario_id") || message.includes("usuario_id")) {
            throw new UserAlreadyInCommitteeError(userId);
          }
        }
      }

      // Si es otro error de base de datos o de runtime, se relanza
      throw error;
    }
  }

  async getMembersByBarrioId(
    barrioId: number
  ): Promise<
    Array<{
      id: number;
      usuarioId: number;
      nombre: string;
      usuario: string;
      rol: string;
      fechaRegistro: Date | null;
    }>
  > {
    const rows = await db
      .select({
        id: miembrosComite.id,
        usuarioId: miembrosComite.usuarioId,
        nombre: usuarios.nombre,
        usuario: usuarios.usuario,
        rol: miembrosComite.rol,
        fechaRegistro: miembrosComite.fechaRegistro,
      })
      .from(miembrosComite)
      .innerJoin(comites, eq(miembrosComite.comiteId, comites.id))
      .innerJoin(usuarios, eq(miembrosComite.usuarioId, usuarios.id))
      .where(eq(comites.barrioId, barrioId));

    return rows;
  }
}


