import type { IncidentRepository } from '../../domain/repositories/IncidentRepository';
import type { SupportStats } from '../../domain/entities/SupportStats';

export class GetIncidentSupportsUseCase {
  constructor(private repository: IncidentRepository) {}

  async execute(apiUrl: string, token: string, incidentId: number): Promise<SupportStats> {
    if (!token) {
      throw new Error('El token de autenticación es requerido.');
    }
    if (!incidentId) {
      throw new Error('El ID de la incidencia es requerido.');
    }
    return this.repository.getIncidentSupports(apiUrl, token, incidentId);
  }
}
