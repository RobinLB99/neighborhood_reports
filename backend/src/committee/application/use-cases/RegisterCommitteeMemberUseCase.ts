import { CommitteeMember } from "../../domain/entities/CommitteeMember.js";
import type { CommitteeRepository } from "../../domain/repositories/CommitteeRepository.interface.js";
import type { AuthRepository } from "../../../authentication/domain/repositories/AuthRepository.interface.js";
import type { RegisterCommitteeMemberDto } from "../dtos/RegisterCommitteeMemberDto.js";
import {
  CommitteeNotFoundError,
  UserNotFoundError,
  UserBarrioMismatchError,
} from "../../../shared-kernel/errors/DomainErrors.js";

export interface RegisterCommitteeMemberResult {
  readonly miembroId: number;
}

/**
 * Caso de Uso: RegisterCommitteeMemberUseCase.
 * 
 * Permite a un líder barrial promover un vecino existente a miembro de la directiva (Secretario, Vocal)
 * de su respectivo comité barrial.
 */
export class RegisterCommitteeMemberUseCase {
  constructor(
    private readonly committeeRepository: CommitteeRepository,
    private readonly authRepository: AuthRepository
  ) {}

  /**
   * Ejecuta la promoción de un usuario existente a miembro del comité.
   * 
   * @param barrioId Barrio ID del líder que realiza la operación (para validaciones de pertenencia).
   * @param dto Contiene el usuarioId a promover y el cargo en el comité (rolComite).
   * @returns Un objeto conteniendo el miembroId generado.
   * @throws CommitteeNotFoundError si el comité no existe para el barrio del líder.
   * @throws UserNotFoundError si el usuario a promover no existe.
   * @throws UserBarrioMismatchError si el usuario a promover no pertenece al barrio del comité.
   */
  async execute(
    barrioId: number,
    dto: RegisterCommitteeMemberDto
  ): Promise<RegisterCommitteeMemberResult> {
    // 1. Validar la existencia del comité para el barrio del líder
    const committee = await this.committeeRepository.getByBarrioId(barrioId);
    if (!committee || !committee.id) {
      throw new CommitteeNotFoundError(barrioId);
    }

    // 2. Buscar al usuario a promover
    const user = await this.authRepository.findById(dto.usuarioId);
    if (!user) {
      throw new UserNotFoundError(dto.usuarioId);
    }

    // 3. Validar que el usuario pertenezca al mismo barrio que el líder / comité
    if (user.barrioId !== barrioId) {
      throw new UserBarrioMismatchError(dto.usuarioId, barrioId);
    }

    // 4. Instanciar entidad de dominio CommitteeMember
    const member = CommitteeMember.create(committee.id, dto.rolComite);

    // 5. Persistir en la base de datos (promover rol de sistema e insertar membresía)
    return this.committeeRepository.registerMember(dto.usuarioId, member);
  }
}
