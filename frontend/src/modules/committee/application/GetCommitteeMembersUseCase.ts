import type { CommitteeRepository } from '../../domain/repositories/CommitteeRepository';
import type { CommitteeMember } from '../../domain/entities/CommitteeMember';

export class GetCommitteeMembersUseCase {
  constructor(private readonly committeeRepository: CommitteeRepository) {}

  async execute(apiUrl: string, token: string): Promise<CommitteeMember[]> {
    if (!token) throw new Error('Token de autenticación requerido');
    return this.committeeRepository.getMembers(apiUrl, token);
  }
}
