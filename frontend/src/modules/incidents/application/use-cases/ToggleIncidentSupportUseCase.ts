import type { IncidentRepository } from '../../domain/repositories/IncidentRepository';
import type { ToggleSupportResult } from '../../domain/entities/SupportStats';

export class ToggleIncidentSupportUseCase {
  constructor(private repository: IncidentRepository) {}

  async execute(apiUrl: string, token: string, incidentId: number): Promise<ToggleSupportResult> {
    if (!token) {
      throw new Error('El token de autenticación es requerido.');
    }
    if (!incidentId) {
      throw new Error('El ID de la incidencia es requerido.');
    }
    return this.repository.toggleIncidentSupport(apiUrl, token, incidentId);
  }
}
