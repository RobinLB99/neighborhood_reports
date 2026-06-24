import { Committee } from "../../domain/entities/Committee.js";
import { CommitteeMember } from "../../domain/entities/CommitteeMember.js";
import type { CommitteeRepository } from "../../domain/repositories/CommitteeRepository.interface.js";
import type { RegisterFirstMemberDto } from "../dtos/RegisterFirstMemberDto.js";

/**
 * Caso de Uso: RegisterFirstMemberUseCase.
 * 
 * Orquesta la creación del comité barrial inicial y el registro de su usuario
 * fundador (Presidente).
 * 
 * Flujo:
 * 1. Instancia el objeto `Committee` validando el territorio.
 * 2. Instancia la membresía `CommitteeMember` con rol directivo "Presidente".
 * 3. Delega el guardado y la promoción del rol en el puerto `CommitteeRepository`.
 */
export class RegisterFirstMemberUseCase {
  constructor(private readonly committeeRepository: CommitteeRepository) {}

  /**
   * Ejecuta el proceso de registro y fundación.
   * 
   * @param userId Identificador del usuario fundador.
   * @param dto Contrato de entrada con el barrioId.
   * @returns Un objeto conteniendo los identificadores generados (comité, usuario, membresía).
   */
  async execute(userId: number, dto: RegisterFirstMemberDto): Promise<{
    committeeId: number;
    usuarioId: number;
    miembroId: number;
  }> {
    // 1. Instanciamos entidades de dominio aplicando reglas internas
    const committee = Committee.create(dto.barrioId);
    const member = CommitteeMember.createFirst("Presidente");

    // 2. Persistimos los datos delegando al puerto de salida (Repository)
    return this.committeeRepository.registerFirstMember(
      committee,
      userId,
      member
    );
  }
}
