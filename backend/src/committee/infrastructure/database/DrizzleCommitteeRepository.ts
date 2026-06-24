import { eq } from "drizzle-orm";
import { db } from "../../../shared-kernel/database/drizzle.js";
import { Committee } from "../../domain/entities/Committee.js";
import { CommitteeMember } from "../../domain/entities/CommitteeMember.js";
import { User } from "../../../authentication/domain/entities/User.js";
import type { CommitteeRepository } from "../../domain/repositories/CommitteeRepository.interface.js";
import { comites, miembrosComite } from "./schema.js";
import { usuarios, roles } from "../../../authentication/infrastructure/database/schema.js";
import {
  CommitteeAlreadyExistsError,
  BarrioNotFoundError,
  UsernameAlreadyTakenError,
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
        // 0. Obtener el ID del rol 'lider'
        const [dbRole] = await tx
          .select({ id: roles.id })
          .from(roles)
          .where(eq(roles.nombre, "lider"))
          .limit(1);

        if (!dbRole) {
          throw new Error("El rol 'lider' no se encuentra configurado en el sistema.");
        }

        // 1. Insertamos el usuario líder
        const [insertedUser] = await tx
          .insert(usuarios)
          .values({
            nombre: user.nombre,
            usuario: user.usuario,
            contrasenaHash: user.contrasenaHash,
            barrioId: user.barrioId,
            rolId: dbRole.id,
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
}
