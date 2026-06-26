import { Comentario } from "../../domain/entities/Comentario.js";
import type { IncidentRepository } from "../../domain/repositories/IncidentRepository.interface.js";
import type { IncidentCommentRepository } from "../../domain/repositories/IncidentCommentRepository.interface.js";
import { ReporteNotFoundError } from "../../../shared-kernel/errors/DomainErrors.js";

/**
 * Parámetros de entrada para el caso de uso de obtención de comentarios.
 */
export interface GetIncidentCommentsInput {
  readonly reporteId: number;
}

/**
 * Caso de Uso: GetIncidentCommentsUseCase.
 * 
 * Recupera los comentarios asociados a un reporte barrial verificando su existencia previa.
 */
export class GetIncidentCommentsUseCase {
  constructor(
    private readonly incidentRepository: IncidentRepository,
    private readonly incidentCommentRepository: IncidentCommentRepository
  ) {}

  /**
   * Ejecuta la consulta de comentarios validando la existencia del reporte.
   * 
   * @param input DTO con reporteId.
   * @returns Listado de comentarios asociados al reporte.
   * @throws ReporteNotFoundError si el reporte no existe.
   * @throws Error si ocurre un error en la persistencia.
   */
  async execute(input: GetIncidentCommentsInput): Promise<Comentario[]> {
    // 1. Validar que el reporte objetivo exista en el sistema
    const reporte = await this.incidentRepository.findById(input.reporteId);
    if (!reporte) {
      throw new ReporteNotFoundError(input.reporteId);
    }

    // 2. Obtener los comentarios asociados
    const comentarios = await this.incidentCommentRepository.getCommentsByReporte(input.reporteId);

    console.info(`[UseCase Success] Recuperados ${comentarios.length} comentarios para el reporte ${input.reporteId}.`);

    return comentarios;
  }
}
