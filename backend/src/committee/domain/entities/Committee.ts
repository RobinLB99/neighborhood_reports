/**
 * Entidad de Dominio: Committee (Comité Barrial).
 * 
 * Modela la junta directiva y el comité representativo de un barrio específico.
 * Un barrio puede tener a lo sumo un único comité barrial activo (regla de unicidad).
 */
export class Committee {
  /**
   * @param id Identificador único de base de datos.
   * @param barrioId Relación de pertenencia hacia un barrio específico.
   * @param fechaCreacion Timestamp de fundación del comité.
   */
  constructor(
    public readonly id: number | undefined,
    public readonly barrioId: number,
    public readonly fechaCreacion: Date | undefined
  ) {}

  /**
   * Factory de creación del Comité.
   * 
   * Valida invariants del dominio al inicializar la entidad.
   * 
   * @throws Error si el identificador del barrio no es consistente.
   */
  static create(barrioId: number): Committee {
    if (!barrioId || barrioId <= 0) {
      throw new Error("El ID de barrio debe ser un número entero positivo válido.");
    }
    return new Committee(undefined, barrioId, undefined);
  }
}
