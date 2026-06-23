import { Committee } from "../entities/Committee.js";
import { CommitteeMember } from "../entities/CommitteeMember.js";

export interface CommitteeRepository {
  /**
   * Registra el primer comité de un barrio y su respectivo primer miembro (Presidente) en una única transacción de base de datos.
   * Lanza un error si el comité ya existe para ese barrio (violación de restricción única).
   */
  registerFirstMember(
    committee: Committee,
    userPayload: {
      nombre: string;
      usuario: string;
      contrasenaHash: string;
      barrioId: number;
    },
    member: CommitteeMember
  ): Promise<{
    committeeId: number;
    usuarioId: number;
    miembroId: number;
  }>;
}
