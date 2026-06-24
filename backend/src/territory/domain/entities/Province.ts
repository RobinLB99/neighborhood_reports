/**
 * Entidad de Dominio: Province (Provincia).
 * 
 * Representa una provincia o división político-territorial de primer nivel.
 * Clase inmutable pura del negocio.
 */
export class Province {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
    public readonly fechaCreacion: Date | undefined
  ) {}

  /**
   * Factory method para instanciar una Provincia con validaciones de dominio.
   */
  static create(id: number, nombre: string, fechaCreacion?: Date): Province {
    if (!id || id <= 0) {
      throw new Error("El ID de la provincia debe ser un número entero positivo.");
    }
    if (!nombre || nombre.trim() === "") {
      throw new Error("El nombre de la provincia no puede estar vacío.");
    }

    return new Province(id, nombre.trim(), fechaCreacion);
  }
}
