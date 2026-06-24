import { Reporte } from "../entities/Reporte.js";

/**
 * Puerto de Persistencia (Outbound Port): IncidentRepository.
 * 
 * Define la interfaz del contrato para acceder y persistir datos
 * correspondientes a los reportes de incidencias ciudadanas en el sistema.
 */
export interface IncidentRepository {
  /**
   * Registra un nuevo reporte de incidencia en el sistema de persistencia.
   * 
   * @param report Entidad de dominio Reporte a persistir.
   * @returns Entidad de dominio Reporte con su ID asignado tras la persistencia.
   */
  createReport(report: Reporte): Promise<Reporte>;
}
