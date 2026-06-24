/**
 * Entidad de Dominio: City (Ciudad / Cantón).
 * 
 * Representa una ciudad o cantón de segundo nivel, perteneciente a una provincia.
 * Clase inmutable pura del negocio.
 */
export class City {
  constructor(
    public readonly id: number,
    public readonly provinciaId: number,
    public readonly nombre: string,
    public readonly fechaCreacion: Date | undefined
  ) {}

  /**
   * Factory method para instanciar una Ciudad con validaciones de dominio.
   */
  static create(
    id: number,
    provinciaId: number,
    nombre: string,
    fechaCreacion?: Date
  ): City {
    if (!id || id <= 0) {
      throw new Error("El ID de la ciudad debe ser un número entero positivo.");
    }
    if (!provinciaId || provinciaId <= 0) {
      throw new Error("El ID de la provincia debe ser un número entero positivo.");
    }
    if (!nombre || nombre.trim() === "") {
      throw new Error("El nombre de la ciudad no puede estar vacío.");
    }

    return new City(id, provinciaId, nombre.trim(), fechaCreacion);
  }
}
