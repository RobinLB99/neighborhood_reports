import type { CommitteeRepository } from '../domain/repositories/CommitteeRepository';
import type { CommitteeMember } from '../domain/entities/CommitteeMember';
import type { Neighbor } from '../domain/entities/Neighbor';

export class HttpCommitteeRepository implements CommitteeRepository {
  async getMembers(apiUrl: string, token: string): Promise<CommitteeMember[]> {
    const res = await fetch(`${apiUrl}/api/committee/members/list`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Error al obtener los miembros del comité.');
    }

    const json = await res.json();
    return json.data as CommitteeMember[];
  }

  async getEligibleNeighbors(apiUrl: string, token: string): Promise<Neighbor[]> {
    const res = await fetch(`${apiUrl}/api/users/neighbors`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Error al obtener los vecinos elegibles.');
    }

    const json = await res.json();
    return json.data as Neighbor[];
  }

  async registerMember(
    apiUrl: string,
    token: string,
    usuarioId: number,
    rolComite: 'Secretario' | 'Vocal'
  ): Promise<{ miembroId: number }> {
    const res = await fetch(`${apiUrl}/api/committee/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ usuarioId, rolComite }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Error al registrar al miembro del comité.');
    }

    const json = await res.json();
    return json.data as { miembroId: number };
  }
}
