import type { CommitteeMember } from '../entities/CommitteeMember';
import type { Neighbor } from '../entities/Neighbor';

export interface CommitteeRepository {
  getMembers(apiUrl: string, token: string): Promise<CommitteeMember[]>;
  getEligibleNeighbors(apiUrl: string, token: string): Promise<Neighbor[]>;
  registerMember(
    apiUrl: string,
    token: string,
    usuarioId: number,
    rolComite: 'Secretario' | 'Vocal'
  ): Promise<{ miembroId: number }>;
}
