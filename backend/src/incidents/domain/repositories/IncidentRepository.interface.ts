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
   * Obtiene la lista de reportes de un barrio, opcionalmente filtrados por estado y paginados por cursor.
   * 
   * @param barrioId ID del barrio de donde se desean consultar los reportes.
   * @param estado Estado opcional por el cual filtrar los reportes.
   * @param limit Límite opcional de registros a retornar (por defecto 10).
   * @param cursor Cursor opcional (fecha ISO string) de inicio para la paginación.
   * @returns Listado de entidades de dominio Reporte.
   */
  listReportsByBarrio(barrioId: number, estado?: string, limit?: number, cursor?: string): Promise<Reporte[]>;

  /**
   * Busca un reporte por su ID.
   * 
   * @param id ID del reporte.
   * @returns La entidad de dominio Reporte o null si no se encuentra.
   */
  findById(id: number): Promise<Reporte | null>;

  /**
   * Realiza la eliminación lógica de un reporte.
   * 
   * @param id ID del reporte a eliminar.
   */
  softDelete(id: number): Promise<void>;
}

