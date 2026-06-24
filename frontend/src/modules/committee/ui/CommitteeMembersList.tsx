import { useState, useEffect } from 'preact/hooks';
import { HttpCommitteeRepository } from '../infrastructure/HttpCommitteeRepository';
import { GetCommitteeMembersUseCase } from '../application/GetCommitteeMembersUseCase';
import type { CommitteeMember } from '../domain/entities/CommitteeMember';

interface Props {
  apiUrl: string;
  token: string;
  refreshTrigger: number;
}

export default function CommitteeMembersList({ apiUrl, token, refreshTrigger }: Props) {
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const committeeRepo = new HttpCommitteeRepository();
  const getCommitteeMembersUseCase = new GetCommitteeMembersUseCase(committeeRepo);

  async function loadMembers() {
    setLoading(true);
    setError(null);
    try {
      const data = await getCommitteeMembersUseCase.execute(apiUrl, token);
      setMembers(data);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los miembros del comité.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadMembers();
    }
  }, [token, refreshTrigger]);

  if (loading) {
    return (
      <div class="bg-chalk border border-hairline rounded-xl p-6 flex justify-center items-center h-48">
        <p class="text-sm text-concrete">Cargando directiva...</p>
      </div>
    );
  }

  return (
    <div class="bg-chalk border border-hairline rounded-xl overflow-hidden">
      <div class="p-6 border-b border-hairline">
        <h2 class="text-lg font-semibold text-graphite mb-1">Directiva del Comité</h2>
        <p class="text-xs text-concrete">
          Lista de representantes oficiales del comité barrial actual.
        </p>
      </div>

      {error && (
        <div class="p-6">
          <div class="text-sm text-graphite bg-mist border border-hairline rounded-lg px-3 py-2.5">
            {error}
          </div>
        </div>
      )}

      {!error && members.length === 0 ? (
        <div class="p-6 text-center text-sm text-concrete h-32 flex items-center justify-center">
          No hay miembros registrados en este comité.
        </div>
      ) : (
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-hairline bg-mist">
                <th class="px-6 py-3 text-xs font-semibold text-graphite uppercase tracking-wider">
                  Nombre
                </th>
                <th class="px-6 py-3 text-xs font-semibold text-graphite uppercase tracking-wider">
                  Usuario
                </th>
                <th class="px-6 py-3 text-xs font-semibold text-graphite uppercase tracking-wider">
                  Cargo
                </th>
                <th class="px-6 py-3 text-xs font-semibold text-graphite uppercase tracking-wider">
                  Fecha de Registro
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-hairline">
              {members.map((member) => (
                <tr key={member.id} class="hover:bg-mist/30 transition-colors">
                  <td class="px-6 py-4 text-sm font-medium text-graphite">
                    {member.nombre}
                  </td>
                  <td class="px-6 py-4 text-sm text-concrete">
                    @{member.usuario}
                  </td>
                  <td class="px-6 py-4 text-sm text-graphite">
                    <span
                      class={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        member.rol === 'Presidente'
                          ? 'bg-graphite text-chalk border-graphite'
                          : 'bg-mist text-graphite border-hairline'
                      }`}
                    >
                      {member.rol}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-concrete">
                    {member.fechaRegistro
                      ? new Date(member.fechaRegistro).toLocaleDateString('es-EC', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
