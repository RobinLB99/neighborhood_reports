/**
 * Entidad de Dominio: User (Usuario).
 * 
 * Representa un usuario dentro del sistema con su identidad y rol de acceso.
 * Esta clase es pura y contiene las invariants (reglas esenciales de negocio) 
 * que garantizan la integridad de un usuario al momento de su creación.
 */
export class User {
  /**
   * @param id Identificador único de base de datos (undefined para nuevos usuarios antes de persistir).
   * @param barrioId Identificador de territorio (barrio) al que pertenece el usuario.
   * @param nombre Nombre y apellido legibles del usuario.
   * @param usuario Nombre de usuario único para credenciales (formateado en minúsculas).
   * @param contrasenaHash Hash criptográfico y seguro de la contraseña.
   * @param rol Rol de privilegios en el sistema (ej: "Lider", "Vecino", "Administrador").
   * @param fechaRegistro Timestamp de registro en el sistema.
   */
  constructor(
    public readonly id: number | undefined,
    public readonly barrioId: number,
    public readonly nombre: string,
    public readonly usuario: string,
    public readonly contrasenaHash: string,
    public readonly rol: string,
    public readonly fechaRegistro: Date | undefined
  ) {}

  /**
   * Método Factory de creación de usuarios.
   * 
   * Ejecuta validaciones estrictas de dominio para impedir la creación
   * de entidades en un estado corrupto o inconsistente.
   * 
   * @throws Error si falla alguna invariant del dominio.
   */
  static create(
    barrioId: number,
    nombre: string,
    usuario: string,
    contrasenaHash: string,
    rol: string = "Vecino"
  ): User {
    if (!barrioId || barrioId <= 0) {
      throw new Error("El ID de barrio debe ser un número entero positivo válido.");
    }
    if (!nombre || nombre.trim() === "") {
      throw new Error("El nombre no puede estar vacío.");
    }
    if (!usuario || usuario.trim() === "") {
      throw new Error("El nombre de usuario no puede estar vacío.");
    }
    if (!contrasenaHash || contrasenaHash.trim() === "") {
      throw new Error("El hash de la contraseña no puede estar vacío.");
    }

    return new User(
      undefined,
      barrioId,
      nombre.trim(),
      usuario.trim().toLowerCase(),
      contrasenaHash,
      rol,
      undefined
    );
  }
}
