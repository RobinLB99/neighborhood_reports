import type { CommitteeRepository } from '../../domain/repositories/CommitteeRepository';
import type { Neighbor } from '../../domain/entities/Neighbor';

export class GetEligibleNeighborsUseCase {
  constructor(private readonly committeeRepository: CommitteeRepository) {}

  async execute(apiUrl: string, token: string): Promise<Neighbor[]> {
    if (!token) throw new Error('Token de autenticación requerido');
    return this.committeeRepository.getEligibleNeighbors(apiUrl, token);
  }
}
