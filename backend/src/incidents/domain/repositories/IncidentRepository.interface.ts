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

  /**
   * Obtiene la lista de reportes activos ('pendiente' y 'en_gestion') de un barrio.
   * 
   * @param barrioId ID del barrio de donde se desean consultar los reportes.
   * @returns Listado de entidades de dominio Reporte.
   */
  listActiveReportsByBarrio(barrioId: number): Promise<Reporte[]>;
}
