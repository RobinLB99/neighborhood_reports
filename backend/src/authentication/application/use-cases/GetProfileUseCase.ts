import type { AuthRepository } from "../../domain/repositories/AuthRepository.interface.js";
import { UserNotFoundError } from "../../../shared-kernel/errors/DomainErrors.js";

/**
 * DTO de salida que modela la información pública y segura del perfil del usuario.
 */
export interface ProfileResult {
  readonly id: number;
  readonly nombre: string;
  readonly usuario: string;
  readonly rol: string;
  readonly barrioId: number;
  readonly fechaRegistro: Date | undefined;
}

/**
 * Caso de Uso: GetProfileUseCase.
 * 
 * Se encarga de recuperar los datos seguros del perfil de un usuario
 * a partir de su identificador único, aislando información sensible.
 */
export class GetProfileUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  /**
   * Obtiene la información del perfil del usuario.
   * 
   * @param userId Identificador único numérico del usuario.
   * @returns ProfileResult con el mapeo seguro del usuario.
   * @throws UserNotFoundError si el identificador provisto no corresponde a ningún registro en la base de datos.
   */
  async execute(userId: number): Promise<ProfileResult> {
    // 1. Intentar recuperar el usuario por su ID
    const user = await this.authRepository.findById(userId);
    
    // Principio de Retorno Temprano
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    if (user.id === undefined) {
      throw new Error("Error interno: Entidad de usuario recuperada sin identificador único.");
    }

    // 2. Retornar el perfil mapeado excluyendo datos sensibles (contraseña hash)
    return {
      id: user.id,
      nombre: user.nombre,
      usuario: user.usuario,
      rol: user.rol,
      barrioId: user.barrioId,
      fechaRegistro: user.fechaRegistro,
    };
  }
}
