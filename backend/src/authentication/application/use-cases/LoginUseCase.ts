import type { AuthRepository } from "../../domain/repositories/AuthRepository.interface.js";
import type { LoginDto } from "../dtos/LoginDto.js";
import { verifyPassword } from "../../../shared-kernel/utils/hash.js";
import { generateJwt } from "../../../shared-kernel/utils/jwt.js";
import { InvalidCredentialsError } from "../../../shared-kernel/errors/DomainErrors.js";

/**
 * DTO de salida estructurada resultante de un inicio de sesión exitoso.
 */
export interface LoginResult {
  readonly token: string;
  readonly user: {
    readonly id: number;
    readonly nombre: string;
    readonly usuario: string;
    readonly rol: string;
    readonly barrioId: number;
  };
}

/**
 * Caso de Uso: LoginUseCase.
 * 
 * Se encarga de la orquestación e inicio de sesión de un usuario.
 * 
 * Flujo:
 * 1. Busca el usuario por su username de forma case-insensitive.
 * 2. Verifica la validez del password utilizando scrypt seguro.
 * 3. En caso de credenciales correctas, genera un token JWT firmado en el Edge.
 * 4. Retorna el token de acceso junto con los datos seguros y no sensibles del perfil.
 */
export class LoginUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  /**
   * Ejecuta el proceso de autenticación.
   * 
   * @param dto Credenciales provistas por el usuario.
   * @returns LoginResult que contiene el token JWT y los datos de identidad.
   * @throws InvalidCredentialsError si el usuario no existe o las credenciales no coinciden.
   */
  async execute(dto: LoginDto): Promise<LoginResult> {
    // 1. Buscar usuario por nombre de usuario (ignorando mayúsculas/minúsculas)
    const user = await this.authRepository.findByUsername(dto.usuario.toLowerCase());
    
    // Principio de Retorno Temprano: si el usuario no existe, rechazamos de inmediato
    if (!user) {
      throw new InvalidCredentialsError();
    }

    // 2. Verificar contraseña con scrypt
    const isPasswordValid = verifyPassword(dto.contrasena, user.contrasenaHash);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // 3. Asegurar que el ID del usuario esté definido (cargado de la BD)
    if (user.id === undefined) {
      throw new Error("Error interno del servidor: Entidad de usuario recuperada sin identificador único.");
    }

    // 4. Firmar el token JWT utilizando el Edge Wrapper jose
    const token = await generateJwt({
      sub: String(user.id),
      rol: user.rol,
      barrioId: user.barrioId,
    });

    // 5. Devolver token y datos seguros del perfil
    return {
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        usuario: user.usuario,
        rol: user.rol,
        barrioId: user.barrioId,
      },
    };
  }
}
