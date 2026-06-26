import { GestionAdministrativa } from "../../domain/entities/GestionAdministrativa.js";
import type { IncidentRepository } from "../../domain/repositories/IncidentRepository.interface.js";
import type { IncidentGestionRepository } from "../../domain/repositories/IncidentGestionRepository.interface.js";
import { ReporteNotFoundError } from "../../../shared-kernel/errors/DomainErrors.js";

/**
 * Parámetros de entrada para el caso de uso de obtención de gestiones administrativas.
 */
export interface ObtenerGestionesPorReporteInput {
  readonly reporteId: number;
}

/**
 * Caso de Uso: ObtenerGestionesPorReporteUseCase.
 * 
 * Recupera el historial de gestiones administrativas asociadas a un reporte
 * verificando previamente la existencia del mismo.
 */
export class ObtenerGestionesPorReporteUseCase {
  constructor(
    private readonly incidentRepository: IncidentRepository,
    private readonly incidentGestionRepository: IncidentGestionRepository
  ) {}

  /**
   * Ejecuta la consulta de gestiones administrativas validando la existencia del reporte.
   * 
   * @param input DTO con el ID del reporte.
   * @returns Listado de gestiones asociadas al reporte.
   * @throws ReporteNotFoundError si el reporte no existe.
   * @throws Error en caso de fallos en la persistencia.
   */
  async execute(
    input: ObtenerGestionesPorReporteInput
  ): Promise<GestionAdministrativa[]> {
    // 1. Validar la existencia del reporte objetivo en el sistema
    const reporte = await this.incidentRepository.findById(input.reporteId);
    if (!reporte) {
      throw new ReporteNotFoundError(input.reporteId);
    }

    // 2. Recuperar el listado de gestiones del repositorio
    const gestiones = await this.incidentGestionRepository.obtenerGestionesPorReporteId(
      input.reporteId
    );

    console.info(
      `[UseCase Success] Recuperadas ${gestiones.length} gestiones para el reporte ${input.reporteId}.`
    );

    return gestiones;
  }
}
