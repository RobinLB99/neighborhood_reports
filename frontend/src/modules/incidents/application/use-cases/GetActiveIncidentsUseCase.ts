import type { IncidentRepository } from '../../domain/repositories/IncidentRepository';
import type { Incident } from '../../domain/entities/Incident';

export class GetActiveIncidentsUseCase {
  constructor(private repository: IncidentRepository) {}

  async execute(apiUrl: string, token: string): Promise<Incident[]> {
    if (!token) {
      throw new Error('El token de autenticación es requerido.');
    }
    return this.repository.getActiveIncidents(apiUrl, token);
  }
}
