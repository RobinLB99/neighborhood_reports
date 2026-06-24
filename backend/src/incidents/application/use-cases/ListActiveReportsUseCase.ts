import { Reporte } from "../../domain/entities/Reporte.js";
import type { IncidentRepository } from "../../domain/repositories/IncidentRepository.interface.js";

/**
 * Parámetros de entrada para la ejecución del caso de uso de listado de reportes activos.
 */
export interface ListActiveReportsInput {
  readonly barrioId: number;
}

/**
 * Caso de Uso: ListActiveReportsUseCase.
 * 
 * Orquesta la lógica para obtener el listado de incidencias barriales activas
 * (con estado 'pendiente' o 'en_gestion' y que no hayan sido borradas lógicamente)
 * para un barrio específico.
 */
export class ListActiveReportsUseCase {
  constructor(private readonly incidentRepository: IncidentRepository) {}

  /**
   * Ejecuta la consulta de reportes barriales activos validando el ID de barrio de entrada.
   * 
   * @param input Parámetro con el ID del barrio.
   * @returns Un arreglo de entidades de dominio Reporte.
   * @throws Error si el ID de barrio no es válido.
   */
  async execute(input: ListActiveReportsInput): Promise<Reporte[]> {
    if (!input.barrioId || input.barrioId <= 0) {
      throw new Error("El ID de barrio debe ser un entero positivo.");
    }

    const activeReports = await this.incidentRepository.listActiveReportsByBarrio(input.barrioId);

    console.info(`[UseCase Success] Se listaron ${activeReports.length} reportes activos para el barrio ID: ${input.barrioId}`);

    return activeReports;
  }
}
