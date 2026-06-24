import { User } from "../../../authentication/domain/entities/User.js";
import { Committee } from "../../domain/entities/Committee.js";
import { CommitteeMember } from "../../domain/entities/CommitteeMember.js";
import type { CommitteeRepository } from "../../domain/repositories/CommitteeRepository.interface.js";
import type { RegisterCommitteeDto } from "../dtos/RegisterCommitteeDto.js";
import { hashPassword } from "../../../shared-kernel/utils/hash.js";

export interface RegisterCommitteeResult {
  readonly committeeId: number;
  readonly usuarioId: number;
  readonly miembroId: number;
}

/**
 * Caso de Uso: RegisterCommitteeUseCase.
 * 
 * Orquesta la creación conjunta de un nuevo comité barrial y el registro del
 * usuario líder que actuará como Presidente fundador.
 * 
 * Flujo:
 * 1. Cifra la contraseña del líder.
 * 2. Instancia la entidad de dominio `User` con rol 'lider'.
 * 3. Instancia la entidad de dominio `Committee` para el barrio especificado.
 * 4. Instancia la entidad `CommitteeMember` con rol "Presidente".
 * 5. Delega la persistencia transaccional al repositorio.
 */
export class RegisterCommitteeUseCase {
  constructor(private readonly committeeRepository: CommitteeRepository) {}

  /**
   * Ejecuta el proceso de registro y fundación.
   * 
   * @param dto Datos del líder barrial y del comité.
   * @returns Un objeto conteniendo los identificadores generados.
   */
  async execute(dto: RegisterCommitteeDto): Promise<RegisterCommitteeResult> {
    // 1. Hashear contraseña
    const contrasenaHash = hashPassword(dto.contrasena);

    // 2. Instanciar entidades de dominio
    const user = User.create(
      dto.barrioId,
      dto.nombre,
      dto.usuario,
      contrasenaHash,
      "lider"
    );
    const committee = Committee.create(dto.barrioId);
    const member = CommitteeMember.createFirst("Presidente");

    // 3. Persistir en transacción única
    return this.committeeRepository.registerFirstMember(
      committee,
      user,
      member
    );
  }
}
