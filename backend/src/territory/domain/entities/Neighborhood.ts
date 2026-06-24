/**
 * Entidad de Dominio: Neighborhood (Barrio).
 * 
 * Representa un barrio de tercer nivel, perteneciente a una ciudad.
 * Clase inmutable pura del negocio.
 */
export class Neighborhood {
  constructor(
    public readonly id: number,
    public readonly ciudadId: number,
    public readonly nombre: string,
    public readonly fechaCreacion: Date | undefined
  ) {}

  /**
   * Factory method para instanciar un Barrio con validaciones de dominio.
   */
  static create(
    id: number,
    ciudadId: number,
    nombre: string,
    fechaCreacion?: Date
  ): Neighborhood {
    if (!id || id <= 0) {
      throw new Error("El ID del barrio debe ser un número entero positivo.");
    }
    if (!ciudadId || ciudadId <= 0) {
      throw new Error("El ID de la ciudad debe ser un número entero positivo.");
    }
    if (!nombre || nombre.trim() === "") {
      throw new Error("El nombre del barrio no puede estar vacío.");
    }

    return new Neighborhood(id, ciudadId, nombre.trim(), fechaCreacion);
  }
}
