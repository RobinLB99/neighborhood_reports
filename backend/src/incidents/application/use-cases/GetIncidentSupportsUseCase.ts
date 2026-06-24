import type { IncidentRepository } from "../../domain/repositories/IncidentRepository.interface.js";
import type { IncidentSupportRepository } from "../../domain/repositories/IncidentSupportRepository.interface.js";
import { ReporteNotFoundError } from "../../../shared-kernel/errors/DomainErrors.js";

export interface GetIncidentSupportsInput {
  readonly usuarioId: number;
  readonly reporteId: number;
}

export interface GetIncidentSupportsOutput {
  readonly count: number;
  readonly hasSupported: boolean;
}

/**
 * Caso de Uso: GetIncidentSupportsUseCase.
 * 
 * Orquesta la lógica para recuperar el recuento total de apoyos de una incidencia
 * y si el usuario solicitante lo ha apoyado.
 */
export class GetIncidentSupportsUseCase {
  constructor(
    private readonly incidentRepository: IncidentRepository,
    private readonly supportRepository: IncidentSupportRepository
  ) {}

  /**
   * Ejecuta la consulta de estadísticas de apoyos de una incidencia.
   * 
   * @param input Parámetros con el usuario solicitante y el reporte.
   * @returns Recuento total de apoyos y booleano indicando si el usuario lo apoyó.
   * @throws ReporteNotFoundError si el reporte no existe.
   */
  async execute(input: GetIncidentSupportsInput): Promise<GetIncidentSupportsOutput> {
    // 1. Validar que el reporte existe en el sistema
    const report = await this.incidentRepository.findById(input.reporteId);
    if (!report) {
      throw new ReporteNotFoundError(input.reporteId);
    }

    // 2. Obtener estadísticas del repositorio de apoyos
    const stats = await this.supportRepository.getSupportStats(
      input.reporteId,
      input.usuarioId
    );

    console.info(
      `[UseCase Success] Estadísticas de apoyos obtenidas para reporte ID ${input.reporteId}. Total: ${stats.count}, Usuario apoyó: ${stats.hasSupported}`
    );

    return stats;
  }
}
