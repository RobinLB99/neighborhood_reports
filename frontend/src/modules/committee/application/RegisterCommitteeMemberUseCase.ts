import type { CommitteeRepository } from '../../domain/repositories/CommitteeRepository';

export class RegisterCommitteeMemberUseCase {
  constructor(private readonly committeeRepository: CommitteeRepository) {}

  async execute(
    apiUrl: string,
    token: string,
    usuarioId: number,
    rolComite: 'Secretario' | 'Vocal'
  ): Promise<{ miembroId: number }> {
    if (!token) throw new Error('Token de autenticación requerido');
    if (!usuarioId) throw new Error('El ID de usuario es requerido');
    if (!rolComite) throw new Error('El rol en el comité es requerido');
    return this.committeeRepository.registerMember(apiUrl, token, usuarioId, rolComite);
  }
}
