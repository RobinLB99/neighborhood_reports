import type { IncidentRepository } from '../../domain/repositories/IncidentRepository';
import type { Comment } from '../../domain/entities/Comment';

export class GetIncidentCommentsUseCase {
  constructor(private repository: IncidentRepository) {}

  async execute(apiUrl: string, token: string, incidentId: number): Promise<Comment[]> {
    if (!token) {
      throw new Error('El token de autenticación es requerido.');
    }
    if (!incidentId) {
      throw new Error('El ID de la incidencia es requerido.');
    }
    return this.repository.getComments(apiUrl, token, incidentId);
  }
}
