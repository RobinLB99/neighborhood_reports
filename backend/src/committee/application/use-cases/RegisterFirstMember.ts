import { Committee } from "../../domain/entities/Committee.js";
import { CommitteeMember } from "../../domain/entities/CommitteeMember.js";
import type { CommitteeRepository } from "../../domain/repositories/CommitteeRepository.interface.js";
import type { RegisterFirstMemberDto } from "../dtos/RegisterFirstMemberDto.js";
import { hashPassword } from "../../../shared-kernel/utils/hash.js";

/**
 * Caso de Uso: RegisterFirstMemberUseCase.
 * 
 * Orquesta la creación del comité barrial inicial y el registro de su usuario
 * fundador (Presidente).
 * 
 * Flujo:
 * 1. Instancia el objeto `Committee` validando el territorio.
 * 2. Instancia la membresía `CommitteeMember` con rol directivo "Presidente".
 * 3. Encripta la contraseña del usuario mediante algoritmos robustos (`scrypt`).
 * 4. Delega el guardado de forma atómica y transaccional en el puerto `CommitteeRepository`.
 */
export class RegisterFirstMemberUseCase {
  constructor(private readonly committeeRepository: CommitteeRepository) {}

  /**
   * Ejecuta el proceso de registro y fundación.
   * 
   * @param dto Contrato de entrada con los datos del barrio y credenciales de usuario.
   * @returns Un objeto conteniendo los identificadores generados (comité, usuario, membresía).
   */
  async execute(dto: RegisterFirstMemberDto): Promise<{
    committeeId: number;
    usuarioId: number;
    miembroId: number;
  }> {
    // 1. Instanciamos entidades de dominio aplicando reglas internas
    const committee = Committee.create(dto.barrioId);
    const member = CommitteeMember.createFirst("Presidente");

    // 2. Ciframos la contraseña usando utilidad nativa
    const contrasenaHash = hashPassword(dto.contrasena);

    // 3. Persistimos los datos delegando al puerto de salida (Repository)
    return this.committeeRepository.registerFirstMember(
      committee,
      {
        nombre: dto.nombre,
        usuario: dto.usuario,
        contrasenaHash,
        barrioId: dto.barrioId,
      },
      member
    );
  }
}
