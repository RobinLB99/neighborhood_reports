import { Comentario } from "../../domain/entities/Comentario.js";
import type { IncidentRepository } from "../../domain/repositories/IncidentRepository.interface.js";
import type { IncidentCommentRepository } from "../../domain/repositories/IncidentCommentRepository.interface.js";
import { ReporteNotFoundError } from "../../../shared-kernel/errors/DomainErrors.js";

/**
 * Parámetros de entrada para el caso de uso de registro de comentarios.
 */
export interface AddCommentToIncidentInput {
  readonly reporteId: number;
  readonly usuarioId: number;
  readonly mensaje: string;
}

/**
 * Caso de Uso: AddCommentToIncidentUseCase.
 * 
 * Registra un comentario en un reporte barrial verificado por su existencia previa.
 */
export class AddCommentToIncidentUseCase {
  constructor(
    private readonly incidentRepository: IncidentRepository,
    private readonly incidentCommentRepository: IncidentCommentRepository
  ) {}

  /**
   * Ejecuta el registro del comentario validando la existencia del reporte y las
   * invariantes de dominio de la entidad Comentario.
   * 
   * @param input DTO con reporteId, usuarioId y mensaje.
   * @returns El comentario persistido con su ID.
   * @throws ReporteNotFoundError si el reporte no existe.
   * @throws Error si falla alguna validación de dominio.
   */
  async execute(input: AddCommentToIncidentInput): Promise<Comentario> {
    // 1. Validar que el reporte objetivo exista en el sistema
    const reporte = await this.incidentRepository.findById(input.reporteId);
    if (!reporte) {
      throw new ReporteNotFoundError(input.reporteId);
    }

    // 2. Crear la entidad de dominio aplicando validaciones inherentes
    const comentario = Comentario.create(
      input.reporteId,
      input.usuarioId,
      input.mensaje
    );

    // 3. Persistir a través del repositorio correspondiente
    const persistedComment = await this.incidentCommentRepository.addComment(comentario);

    console.info(`[UseCase Success] Comentario registrado con éxito en reporte ${input.reporteId} por usuario ${input.usuarioId}.`);

    return persistedComment;
  }
}
