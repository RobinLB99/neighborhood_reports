/**
 * Puerto de Persistencia (Outbound Port): IncidentSupportRepository.
 * 
 * Define la interfaz del contrato para acceder y persistir datos
 * correspondientes a los apoyos (likes) de incidencias en el sistema.
 */
export interface IncidentSupportRepository {
  /**
   * Alterna (registra o elimina) un apoyo para una incidencia por parte de un usuario.
   * 
   * @param usuarioId ID del usuario que realiza la acción.
   * @param reporteId ID de la incidencia que recibe el apoyo.
   * @returns `true` si se registró el apoyo, `false` si se eliminó.
   */
  toggleSupport(usuarioId: number, reporteId: number): Promise<boolean>;

  /**
   * Obtiene la estadística de apoyos para un reporte.
   * 
   * @param reporteId ID de la incidencia.
   * @param usuarioId ID del usuario solicitante (para saber si la apoyó).
   */
  getSupportStats(
    reporteId: number,
    usuarioId: number
  ): Promise<{ count: number; hasSupported: boolean }>;
}
