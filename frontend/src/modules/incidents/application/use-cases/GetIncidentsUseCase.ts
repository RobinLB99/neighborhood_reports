import type { IncidentRepository } from '../../domain/repositories/IncidentRepository';
import type { Incident } from '../../domain/entities/Incident';

export class GetIncidentsUseCase {
  constructor(private repository: IncidentRepository) {}

  async execute(apiUrl: string, token: string, status?: string): Promise<Incident[]> {
    if (!token) {
      throw new Error('El token de autenticación es requerido.');
    }
    return this.repository.getIncidents(apiUrl, token, status);
  }
}
