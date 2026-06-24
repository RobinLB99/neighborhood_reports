import { Committee } from "../entities/Committee.js";
import { CommitteeMember } from "../entities/CommitteeMember.js";
import { User } from "../../../authentication/domain/entities/User.js";

export interface CommitteeRepository {
  /**
   * Registra el usuario líder, el primer comité de un barrio y su respectivo primer miembro (Presidente) en una única transacción de base de datos.
   * Lanza un error si el comité ya existe para ese barrio (violación de restricción única).
   */
  registerFirstMember(
    committee: Committee,
    user: User,
    member: CommitteeMember
  ): Promise<{
    committeeId: number;
    usuarioId: number;
    miembroId: number;
  }>;

  /**
   * Obtiene un comité barrial por el identificador del barrio.
   */
  getByBarrioId(barrioId: number): Promise<Committee | null>;

  /**
   * Promueve un usuario existente al rol de sistema 'miembro' y lo registra en miembros_comite.
   */
  registerMember(
    userId: number,
    member: CommitteeMember
  ): Promise<{
    miembroId: number;
  }>;

  /**
   * Obtiene todos los miembros asociados al comité de un barrio con sus datos de usuario.
   */
  getMembersByBarrioId(
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
  >;
}



