import type { IncidentRepository } from '../../domain/repositories/IncidentRepository';
import type { Gestion } from '../../domain/entities/Gestion';

export class CreateIncidentGestionUseCase {
  constructor(private repository: IncidentRepository) {}

  async execute(
    apiUrl: string,
    token: string,
    incidentId: number,
    estadoAsignado: 'pendiente' | 'en_gestion' | 'solucionado',
    mensaje: string
  ): Promise<Gestion> {
    if (!token) {
      throw new Error('El token de autenticación es requerido.');
    }
    if (!incidentId) {
      throw new Error('El ID de la incidencia es requerido.');
    }
    if (!estadoAsignado) {
      throw new Error('El estado asignado es requerido.');
    }
    if (!mensaje || !mensaje.trim()) {
      throw new Error('El mensaje justificativo de la gestión es obligatorio.');
    }
    return this.repository.createGestion(apiUrl, token, incidentId, estadoAsignado, mensaje);
  }
}
