import { Reporte } from "../../domain/entities/Reporte.js";
import type { IncidentRepository } from "../../domain/repositories/IncidentRepository.interface.js";

/**
 * Parámetros de entrada para la ejecución del caso de uso de listado de reportes.
 */
export interface ListReportsInput {
  readonly barrioId: number;
  readonly estado?: string | undefined;
  readonly limit?: number | undefined;
  readonly cursor?: string | undefined;
}

/**
 * Resultado retornado por el caso de uso de listado de reportes paginado.
 */
export interface ListReportsOutput {
  readonly reports: Reporte[];
  readonly nextCursor: string | null;
}

/**
 * Caso de Uso: ListReportsUseCase.
 * 
 * Orquesta la lógica para obtener el listado de incidencias barriales
 * filtradas opcionalmente por su estado (ej: 'pendiente', 'en_gestion', 'solucionado')
 * y que no hayan sido borradas lógicamente, para un barrio específico.
 */
export class ListReportsUseCase {
  constructor(private readonly incidentRepository: IncidentRepository) {}

  /**
   * Ejecuta la consulta de reportes barriales validando el ID de barrio de entrada.
   * 
   * @param input Parámetro con el ID del barrio, filtro de estado y datos de paginación.
   * @returns Un listado paginado con sus reportes y el siguiente cursor.
   * @throws Error si el ID de barrio no es válido.
   */
  async execute(input: ListReportsInput): Promise<ListReportsOutput> {
    if (!input.barrioId || input.barrioId <= 0) {
      throw new Error("El ID de barrio debe ser un entero positivo.");
    }

    const limit = input.limit || 10;
    const reports = await this.incidentRepository.listReportsByBarrio(
      input.barrioId,
      input.estado,
      limit,
      input.cursor
    );

    // Si los reportes devueltos son menores que el límite solicitado, significa que ya no hay más páginas.
    // De lo contrario, usamos la fecha del último reporte como cursor.
    let nextCursor: string | null = null;
    if (reports.length === limit && reports.length > 0) {
      const lastReport = reports[reports.length - 1];
      if (lastReport.fechaCreacion) {
        nextCursor = lastReport.fechaCreacion.toISOString();
      }
    }

    console.info(`[UseCase Success] Se listaron ${reports.length} reportes con filtro estado '${input.estado || "todos"}' para el barrio ID: ${input.barrioId}. Siguiente cursor: ${nextCursor}`);

    return {
      reports,
      nextCursor,
    };
  }
}
