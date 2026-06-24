import type { IncidentRepository } from "../../domain/repositories/IncidentRepository.interface.js";
import type { IncidentSupportRepository } from "../../domain/repositories/IncidentSupportRepository.interface.js";
import { ReporteNotFoundError } from "../../../shared-kernel/errors/DomainErrors.js";

export interface ToggleIncidentSupportInput {
  readonly usuarioId: number;
  readonly reporteId: number;
}

/**
 * Caso de Uso: ToggleIncidentSupportUseCase.
 * 
 * Orquesta la lógica para registrar (apoyar) o eliminar (quitar apoyo) de una incidencia.
 */
export class ToggleIncidentSupportUseCase {
  constructor(
    private readonly incidentRepository: IncidentRepository,
    private readonly supportRepository: IncidentSupportRepository
  ) {}

  /**
   * Ejecuta la alternancia del apoyo para un reporte.
   * 
   * @param input Parámetros con el usuario y reporte.
   * @returns `true` si el reporte fue apoyado, `false` si se le quitó el apoyo.
   * @throws ReporteNotFoundError si el reporte no existe en el sistema.
   */
  async execute(input: ToggleIncidentSupportInput): Promise<boolean> {
    // 1. Validar que el reporte existe en el sistema
    const report = await this.incidentRepository.findById(input.reporteId);
    if (!report) {
      throw new ReporteNotFoundError(input.reporteId);
    }

    // 2. Alternar el apoyo en la base de datos
    const isSupported = await this.supportRepository.toggleSupport(
      input.usuarioId,
      input.reporteId
    );

    console.info(
      `[UseCase Success] Apoyo alternado por el usuario ID ${input.usuarioId} en el reporte ID ${input.reporteId}. Estado final: ${isSupported ? "Apoyado" : "Sin Apoyo"}`
    );

    return isSupported;
  }
}
