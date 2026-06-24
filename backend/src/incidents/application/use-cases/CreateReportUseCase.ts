import { Reporte } from "../../domain/entities/Reporte.js";
import type { IncidentRepository } from "../../domain/repositories/IncidentRepository.interface.js";

/**
 * Parámetros de entrada para la ejecución del caso de uso de creación de reportes.
 */
export interface CreateReportInput {
  readonly usuarioId: number;
  readonly barrioId: number;
  readonly direccion: string;
  readonly ubicacion: string;
  readonly fotoUrl: string;
  readonly descripcion: string;
}

/**
 * Caso de Uso: CreateReportUseCase.
 * 
 * Orquesta la lógica para registrar una nueva incidencia ciudadana (reporte)
 * en el barrio al que pertenece el usuario autenticado.
 */
export class CreateReportUseCase {
  constructor(private readonly incidentRepository: IncidentRepository) {}

  /**
   * Ejecuta la creación del reporte aplicando validaciones de dominio
   * y persistiendo el registro a través del puerto del repositorio.
   * 
   * @param input Datos necesarios para crear el reporte.
   * @returns El reporte ciudadano recién creado y persistido con su ID asignado.
   * @throws Error si falla alguna validación o invariant del dominio.
   */
  async execute(input: CreateReportInput): Promise<Reporte> {
    // 1. Instanciación y validación de invariants en la entidad de dominio
    const newReport = Reporte.create(
      input.usuarioId,
      input.barrioId,
      input.direccion,
      input.ubicacion,
      input.fotoUrl,
      input.descripcion
    );

    // 2. Persistencia en la base de datos a través del puerto
    const persistedReport = await this.incidentRepository.createReport(newReport);

    console.info(`[UseCase Success] Nuevo reporte creado e insertado. ID: ${persistedReport.id}, por el usuario: ${persistedReport.usuarioId}`);

    return persistedReport;
  }
}
