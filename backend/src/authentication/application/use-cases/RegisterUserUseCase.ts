import { User } from "../../domain/entities/User.js";
import type { AuthRepository } from "../../domain/repositories/AuthRepository.interface.js";
import type { CommitteeExistsGateway } from "../../domain/repositories/CommitteeExistsGateway.interface.js";
import type { RegisterUserDto } from "../dtos/RegisterUserDto.js";
import { hashPassword } from "../../../shared-kernel/utils/hash.js";
import { CommitteeNotFoundError } from "../../../shared-kernel/errors/DomainErrors.js";

export interface RegisterUserResult {
  readonly id: number;
  readonly nombre: string;
  readonly usuario: string;
  readonly rol: string;
  readonly barrioId: number;
  readonly fechaRegistro: Date | undefined;
}

/**
 * Caso de Uso: RegisterUserUseCase.
 * 
 * Orquesta el registro de un nuevo usuario en la plataforma.
 * Cifra la contraseña y delega el guardado en el repositorio de autenticación.
 */
export class RegisterUserUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly committeeExistsGateway: CommitteeExistsGateway
  ) {}

  /**
   * Ejecuta el proceso de registro del usuario.
   * 
   * @param dto Datos de registro (nombre, usuario, contrasena, barrioId).
   * @returns Datos públicos del usuario registrado.
   */
  async execute(dto: RegisterUserDto): Promise<RegisterUserResult> {
    // Validar que exista el comité barrial antes del registro
    const committeeExists = await this.committeeExistsGateway.existsInBarrio(dto.barrioId);
    if (!committeeExists) {
      throw new CommitteeNotFoundError(dto.barrioId);
    }

    // 1. Ciframos la contraseña usando utilidad nativa
    const contrasenaHash = hashPassword(dto.contrasena);

    // 2. Instanciamos la entidad de dominio User con el rol por defecto 'ciudadano'
    const user = User.create(
      dto.barrioId,
      dto.nombre,
      dto.usuario,
      contrasenaHash,
      "ciudadano"
    );

    // 3. Persistimos los datos a través del repositorio
    const savedUser = await this.authRepository.register(user);

    if (savedUser.id === undefined) {
      throw new Error("Error interno: El usuario registrado no retornó un identificador único.");
    }

    // 4. Retornamos el resultado seguro
    return {
      id: savedUser.id,
      nombre: savedUser.nombre,
      usuario: savedUser.usuario,
      rol: savedUser.rol,
      barrioId: savedUser.barrioId,
      fechaRegistro: savedUser.fechaRegistro,
    };
  }
}
