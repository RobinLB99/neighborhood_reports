import type { IncidentRepository } from '../../domain/repositories/IncidentRepository';
import type { Comment } from '../../domain/entities/Comment';

export class AddIncidentCommentUseCase {
  constructor(private repository: IncidentRepository) {}

  async execute(apiUrl: string, token: string, incidentId: number, message: string): Promise<Comment> {
    if (!token) {
      throw new Error('El token de autenticación es requerido.');
    }
    if (!incidentId) {
      throw new Error('El ID de la incidencia es requerido.');
    }
    if (!message || message.trim() === '') {
      throw new Error('El mensaje del comentario no puede estar vacío.');
    }
    if (message.length > 500) {
      throw new Error('El comentario no puede exceder los 500 caracteres.');
    }
    return this.repository.addComment(apiUrl, token, incidentId, message.trim());
  }
}
