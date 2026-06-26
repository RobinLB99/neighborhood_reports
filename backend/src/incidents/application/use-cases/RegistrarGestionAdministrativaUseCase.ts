import { GestionAdministrativa } from "../../domain/entities/GestionAdministrativa.js";
import type { IncidentRepository } from "../../domain/repositories/IncidentRepository.interface.js";
import type { IncidentGestionRepository } from "../../domain/repositories/IncidentGestionRepository.interface.js";
import { ReporteNotFoundError, InvalidStateTransitionError } from "../../../shared-kernel/errors/DomainErrors.js";
import { type ReportStatus } from "../../domain/entities/Reporte.js";

/**
 * Parámetros de entrada para el caso de uso de registro de gestión administrativa.
 */
export interface RegistrarGestionInput {
  readonly reporteId: number;
  readonly liderId: number;
  readonly estadoAsignado: ReportStatus;
  readonly mensaje: string;
}

/**
 * Caso de Uso: RegistrarGestionAdministrativaUseCase.
 * 
 * Registra una acción de gestión (cambio de estado y bitácora) sobre un reporte barrial,
 * validando que el reporte exista y que la transición del estado sea estrictamente hacia adelante.
 */
export class RegistrarGestionAdministrativaUseCase {
  constructor(
    private readonly incidentRepository: IncidentRepository,
    private readonly incidentGestionRepository: IncidentGestionRepository
  ) {}

  /**
   * Ejecuta el registro de la gestión administrativa validando la existencia del reporte,
   * el flujo de estados permitido y guardando los cambios de forma transaccional.
   * 
   * @param input DTO con reporteId, liderId, estadoAsignado y mensaje.
   * @returns La gestión administrativa persistida.
   * @throws ReporteNotFoundError si el reporte no existe.
   * @throws InvalidStateTransitionError si se intenta revertir el estado del reporte.
   * @throws Error si falla alguna validación de dominio.
   */
  async execute(input: RegistrarGestionInput): Promise<GestionAdministrativa> {
    // 1. Validar que el reporte objetivo exista en el sistema
    const reporte = await this.incidentRepository.findById(input.reporteId);
    if (!reporte) {
      throw new ReporteNotFoundError(input.reporteId);
    }

    // 2. Validar máquina de estados: Flujo únicamente hacia adelante
    // Estados permitidos: pendiente (0) -> en_gestion (1) -> solucionado (2)
    const STATUS_ORDER = ["pendiente", "en_gestion", "solucionado"] as const;
    const currentIndex = STATUS_ORDER.indexOf(reporte.estado);
    const nextIndex = STATUS_ORDER.indexOf(input.estadoAsignado);

    if (nextIndex < currentIndex) {
      throw new InvalidStateTransitionError(
        `No se puede revertir el estado del reporte de '${reporte.estado}' a '${input.estadoAsignado}'.`
      );
    }

    // 3. Crear la entidad de dominio de gestión aplicando validaciones inherentes
    const gestion = GestionAdministrativa.create(
      input.reporteId,
      input.liderId,
      input.estadoAsignado,
      input.mensaje
    );

    // 4. Persistir a través del repositorio de gestión de forma transaccional
    const persistedGestion = await this.incidentGestionRepository.registrarGestionYActualizarEstado(gestion);

    console.info(`[UseCase Success] Gestión registrada con éxito en reporte ${input.reporteId} por el líder/miembro ${input.liderId}. Estado cambiado a '${input.estadoAsignado}'.`);

    return persistedGestion;
  }
}
