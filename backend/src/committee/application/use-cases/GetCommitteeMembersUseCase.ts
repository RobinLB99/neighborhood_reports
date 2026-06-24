import type { CommitteeRepository } from "../../domain/repositories/CommitteeRepository.interface.js";
import { CommitteeNotFoundError } from "../../../shared-kernel/errors/DomainErrors.js";
import type { CommitteeMemberItemDto } from "../dtos/GetCommitteeMembersDto.js";

/**
 * Caso de Uso: GetCommitteeMembersUseCase.
 * 
 * Permite a un líder barrial o miembro del comité obtener el listado completo de la junta directiva
 * de su comité barrial.
 */
export class GetCommitteeMembersUseCase {
  constructor(private readonly committeeRepository: CommitteeRepository) {}

  /**
   * Ejecuta la consulta de miembros del comité para un barrio específico.
   * 
   * @param barrioId Identificador único del barrio.
   * @returns Un listado con los datos de los miembros del comité y sus cuentas de usuario.
   * @throws CommitteeNotFoundError si el comité no existe para el barrio especificado.
   */
  async execute(barrioId: number): Promise<CommitteeMemberItemDto[]> {
    // 1. Validar la existencia del comité para el barrio del solicitante
    const committee = await this.committeeRepository.getByBarrioId(barrioId);
    if (!committee || !committee.id) {
      throw new CommitteeNotFoundError(barrioId);
    }

    // 2. Consultar todos los miembros asociados a este comité
    const members = await this.committeeRepository.getMembersByBarrioId(barrioId);

    // 3. Retornar y mapear el listado estructurado
    return members.map((member) => ({
      id: member.id,
      usuarioId: member.usuarioId,
      nombre: member.nombre,
      usuario: member.usuario,
      rol: member.rol as "Presidente" | "Secretario" | "Vocal",
      fechaRegistro: member.fechaRegistro ? member.fechaRegistro.toISOString() : null,
    }));
  }
}
