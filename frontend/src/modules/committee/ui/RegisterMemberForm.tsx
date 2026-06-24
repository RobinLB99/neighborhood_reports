import { useState, useEffect } from 'preact/hooks';
import { HttpCommitteeRepository } from '../infrastructure/HttpCommitteeRepository';
import { GetEligibleNeighborsUseCase } from '../application/GetEligibleNeighborsUseCase';
import { RegisterCommitteeMemberUseCase } from '../application/RegisterCommitteeMemberUseCase';
import type { Neighbor } from '../domain/entities/Neighbor';

interface Props {
  apiUrl: string;
  token: string;
  onMemberRegistered: () => void;
}

export default function RegisterMemberForm({ apiUrl, token, onMemberRegistered }: Props) {
  const [neighbors, setNeighbors] = useState<Neighbor[]>([]);
  const [selectedNeighborId, setSelectedNeighborId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Secretario' | 'Vocal'>('Secretario');
  const [loading, setLoading] = useState(false);
  const [fetchingNeighbors, setFetchingNeighbors] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const committeeRepo = new HttpCommitteeRepository();
  const getEligibleNeighborsUseCase = new GetEligibleNeighborsUseCase(committeeRepo);
  const registerMemberUseCase = new RegisterCommitteeMemberUseCase(committeeRepo);

  async function loadNeighbors() {
    setFetchingNeighbors(true);
    setError(null);
    try {
      const data = await getEligibleNeighborsUseCase.execute(apiUrl, token);
      setNeighbors(data);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los vecinos elegibles.');
    } finally {
      setFetchingNeighbors(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadNeighbors();
    }
  }, [token]);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!selectedNeighborId) {
      setError('Debes seleccionar un vecino.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await registerMemberUseCase.execute(
        apiUrl,
        token,
        parseInt(selectedNeighborId, 10),
        selectedRole
      );
      setSuccess('Vecino promovido a miembro del comité exitosamente.');
      setSelectedNeighborId('');
      onMemberRegistered();
      // Recargar vecinos disponibles
      await loadNeighbors();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al registrar al miembro.');
    } finally {
      setLoading(false);
    }
  }

  const selectClass =
    'bg-chalk border border-hairline rounded-lg px-3 py-3 text-sm text-graphite focus:outline-none focus:border-graphite transition-colors disabled:opacity-50 disabled:cursor-not-allowed appearance-none w-full';

  return (
    <div class="bg-chalk border border-hairline rounded-xl p-6">
      <h2 class="text-lg font-semibold text-graphite mb-1">Promover miembro a la directiva</h2>
      <p class="text-xs text-concrete mb-4">
        Selecciona un ciudadano registrado en tu barrio para asignarle un rol en el comité directivo.
      </p>

      <form onSubmit={handleSubmit} class="flex flex-col gap-4">
        {error && (
          <div class="text-sm text-graphite bg-mist border border-hairline rounded-lg px-3 py-2.5">
            {error}
          </div>
        )}

        {success && (
          <div class="text-sm text-graphite bg-mist border border-hairline rounded-lg px-3 py-2.5">
            {success}
          </div>
        )}

        {/* Vecino */}
        <div class="flex flex-col gap-1.5">
          <label for="reg-member-user" class="text-sm font-medium text-graphite">
            Vecino elegible
          </label>
          <select
            id="reg-member-user"
            value={selectedNeighborId}
            onChange={(e) => setSelectedNeighborId((e.currentTarget as HTMLSelectElement).value)}
            disabled={fetchingNeighbors || loading}
            required
            class={selectClass}
          >
            <option value="">
              {fetchingNeighbors ? 'Cargando vecinos...' : 'Selecciona un vecino'}
            </option>
            {neighbors.map((n) => (
              <option key={n.id} value={String(n.id)}>
                {n.nombre} (@{n.usuario})
              </option>
            ))}
          </select>
          {!fetchingNeighbors && neighbors.length === 0 && (
            <span class="text-xs text-concrete">
              No hay vecinos elegibles registrados en este barrio.
            </span>
          )}
        </div>

        {/* Rol */}
        <div class="flex flex-col gap-1.5">
          <label for="reg-member-role" class="text-sm font-medium text-graphite">
            Cargo en el comité
          </label>
          <select
            id="reg-member-role"
            value={selectedRole}
            onChange={(e) =>
              setSelectedRole((e.currentTarget as HTMLSelectElement).value as 'Secretario' | 'Vocal')
            }
            disabled={loading}
            required
            class={selectClass}
          >
            <option value="Secretario">Secretario</option>
            <option value="Vocal">Vocal</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || fetchingNeighbors || !selectedNeighborId}
          class="bg-graphite text-chalk text-sm font-medium rounded-lg px-4 py-3 hover:bg-carbon disabled:opacity-50 transition-colors mt-2 cursor-pointer disabled:cursor-not-allowed w-full"
        >
          {loading ? 'Promoviendo...' : 'Asignar cargo'}
        </button>
      </form>
    </div>
  );
}
