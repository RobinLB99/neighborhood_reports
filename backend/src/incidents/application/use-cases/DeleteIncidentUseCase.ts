import type { IncidentRepository } from "../../domain/repositories/IncidentRepository.interface.js";

/**
 * Parámetros de entrada para la ejecución del caso de uso de eliminación de reportes.
 */
export interface DeleteIncidentInput {
  readonly reportId: number;
  readonly userId: number;
  readonly userRole: string;
}

/**
 * Caso de Uso: DeleteIncidentUseCase.
 * 
 * Orquesta la lógica para realizar el borrado lógico de una incidencia.
 * Verifica permisos del usuario según el rol.
 */
export class DeleteIncidentUseCase {
  constructor(private readonly incidentRepository: IncidentRepository) {}

  /**
   * Ejecuta la eliminación lógica aplicando reglas de negocio y autorización.
   * 
   * @param input Parámetros necesarios para eliminar el reporte.
   * @throws Error si el reporte no existe o el usuario no tiene permisos de eliminación.
   */
  async execute(input: DeleteIncidentInput): Promise<void> {
    const { reportId, userId, userRole } = input;

    // 1. Obtener el reporte por ID
    const report = await this.incidentRepository.findById(reportId);
    if (!report) {
      throw new Error(`[NotFound] Reporte con ID ${reportId} no encontrado o inactivo.`);
    }

    // 2. Validación de autorización
    // Líderes y miembros pueden borrar cualquier reporte
    const isDirective = userRole === "lider" || userRole === "miembro";
    
    // Ciudadanos solo pueden borrar sus propios reportes
    if (userRole === "ciudadano" && report.usuarioId !== userId) {
      throw new Error(`[Unauthorized] No tienes permisos para eliminar este reporte.`);
    }

    // Si el rol es desconocido o no es directivo/dueño
    if (!isDirective && userRole !== "ciudadano") {
      throw new Error(`[Unauthorized] Rol "${userRole}" no autorizado para realizar esta acción.`);
    }

    // 3. Ejecutar borrado lógico
    await this.incidentRepository.softDelete(reportId);

    console.info(`[UseCase Success] Reporte ID ${reportId} eliminado lógicamente por el usuario ID ${userId} (Rol: ${userRole}).`);
  }
}
