import { User } from "../entities/User.js";

export interface AuthRepository {
  /**
   * Busca un usuario por su nombre de usuario (usuario).
   * Retorna null si no se encuentra.
   */
  findByUsername(usuario: string): Promise<User | null>;

  /**
   * Busca un usuario por su ID único.
   * Retorna null si no se encuentra.
   */
  findById(id: number): Promise<User | null>;

  /**
   * Registra un nuevo usuario en la base de datos.
   */
  register(user: User): Promise<User>;

  /**
   * Actualiza el rol de un usuario en el sistema.
   */
  updateUserRole(userId: number, roleName: string): Promise<void>;
}
