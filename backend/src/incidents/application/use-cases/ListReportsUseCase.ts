import { Reporte } from "../../domain/entities/Reporte.js";
import type { IncidentRepository } from "../../domain/repositories/IncidentRepository.interface.js";

/**
 * Parámetros de entrada para la ejecución del caso de uso de listado de reportes.
 */
export interface ListReportsInput {
  readonly barrioId: number;
  readonly estado?: string | undefined;
}

/**
 * Caso de Uso: ListReportsUseCase.
 * 
 * Orquesta la lógica para obtener el listado de incidencias barriales
 * filtradas opcionalmente por su estado (ej: 'pendiente', 'en_gestion', 'solucionado')
 * y que no hayan sido borradas lógicamente, para un barrio específico.
 */
export class ListReportsUseCase {
  constructor(private readonly incidentRepository: IncidentRepository) {}

  /**
   * Ejecuta la consulta de reportes barriales validando el ID de barrio de entrada.
   * 
   * @param input Parámetro con el ID del barrio y filtro opcional de estado.
   * @returns Un arreglo de entidades de dominio Reporte.
   * @throws Error si el ID de barrio no es válido.
   */
  async execute(input: ListReportsInput): Promise<Reporte[]> {
    if (!input.barrioId || input.barrioId <= 0) {
      throw new Error("El ID de barrio debe ser un entero positivo.");
    }

    const reports = await this.incidentRepository.listReportsByBarrio(input.barrioId, input.estado);

    console.info(`[UseCase Success] Se listaron ${reports.length} reportes con filtro estado '${input.estado || "todos"}' para el barrio ID: ${input.barrioId}`);

    return reports;
  }
}
