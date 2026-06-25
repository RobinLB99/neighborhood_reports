import { GestionAdministrativa } from "../entities/GestionAdministrativa.js";

/**
 * Puerto de Persistencia (Outbound Port): IncidentGestionRepository.
 * 
 * Define la interfaz del contrato para registrar gestiones administrativas
 * y actualizar el estado de los reportes correspondientes de forma transaccional.
 */
export interface IncidentGestionRepository {
  /**
   * Registra una nueva gestión administrativa y actualiza el estado del reporte
   * de forma atómica (transaccional).
   * 
   * @param gestion Entidad de dominio GestionAdministrativa.
   * @returns La entidad de dominio GestionAdministrativa con su ID asignado.
   */
  registrarGestionYActualizarEstado(
    gestion: GestionAdministrativa
  ): Promise<GestionAdministrativa>;

  /**
   * Obtiene la lista de gestiones administrativas de un reporte, ordenadas descendentemente por fecha.
   * Incluye el nombre del líder/miembro que registró la gestión.
   * 
   * @param reporteId ID del reporte.
   * @returns Lista de gestiones asociadas.
   */
  obtenerGestionesPorReporteId(
    reporteId: number
  ): Promise<GestionAdministrativa[]>;
}
