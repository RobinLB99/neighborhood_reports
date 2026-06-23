/**
 * Roles permitidos en la directiva de un Comité Barrial.
 */
export type CommitteeRole = "Presidente" | "Secretario" | "Vocal";

/**
 * Entidad de Dominio: CommitteeMember (Miembro del Comité).
 * 
 * Modela la vinculación de un usuario con un cargo directivo específico en un comité barrial.
 */
export class CommitteeMember {
  /**
   * @param id Identificador único del registro de membresía.
   * @param comiteId Relación con el comité al que pertenece.
   * @param usuarioId Relación con la cuenta de usuario del miembro.
   * @param rol Cargo directivo asignado en la directiva.
   * @param fechaRegistro Timestamp de registro en la junta.
   */
  constructor(
    public readonly id: number | undefined,
    public readonly comiteId: number | undefined,
    public readonly usuarioId: number | undefined,
    public readonly rol: CommitteeRole,
    public readonly fechaRegistro: Date | undefined
  ) {}

  /**
   * Factory de creación para el fundador o primer miembro del comité.
   * 
   * Impone la invariant de que el primer miembro de la directiva
   * debe poseer estrictamente el rol de Presidente.
   * 
   * @throws Error si el rol inicial no coincide con 'Presidente'.
   */
  static createFirst(rol: CommitteeRole = "Presidente"): CommitteeMember {
    if (rol !== "Presidente") {
      throw new Error("El primer miembro del comité registrado debe poseer el rol de Presidente.");
    }
    return new CommitteeMember(undefined, undefined, undefined, rol, undefined);
  }
}
