import type { IncidentRepository } from '../../domain/repositories/IncidentRepository';
import type { Gestion } from '../../domain/entities/Gestion';

export class GetIncidentGestionesUseCase {
  constructor(private repository: IncidentRepository) {}

  async execute(apiUrl: string, token: string, incidentId: number): Promise<Gestion[]> {
    if (!token) {
      throw new Error('El token de autenticación es requerido.');
    }
    if (!incidentId) {
      throw new Error('El ID de la incidencia es requerido.');
    }
    return this.repository.getGestiones(apiUrl, token, incidentId);
  }
}
