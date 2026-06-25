import { Comentario } from "../entities/Comentario.js";

/**
 * Puerto de Persistencia (Outbound Port): IncidentCommentRepository.
 * 
 * Define la interfaz del contrato para acceder y persistir datos
 * correspondientes a los comentarios de incidencias en el sistema.
 */
export interface IncidentCommentRepository {
  /**
   * Registra un nuevo comentario en un reporte.
   * 
   * @param comentario Entidad de dominio Comentario a registrar.
   * @returns La entidad de dominio Comentario creada y persistida.
   */
  addComment(comentario: Comentario): Promise<Comentario>;

  /**
   * Obtiene todos los comentarios asociados a un reporte específico.
   * 
   * @param reporteId ID del reporte.
   * @returns Listado de comentarios del reporte.
   */
  getCommentsByReporte(reporteId: number): Promise<Comentario[]>;
}
