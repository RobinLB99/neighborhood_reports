import { useEffect, useState } from 'preact/hooks';

interface Option {
  id: number;
  nombre: string;
}

interface Props {
  apiUrl: string;
}

export default function RegisterCommitteeForm({ apiUrl }: Props) {
  const [nombre, setNombre] = useState('');
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');

  const [provinces, setProvinces] = useState<Option[]>([]);
  const [cities, setCities] = useState<Option[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Option[]>([]);

  const [provinceId, setProvinceId] = useState('');
  const [cityId, setCityId] = useState('');
  const [barrioId, setBarrioId] = useState('');

  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar provincias al montar
  useEffect(() => {
    fetch(`${apiUrl}/api/territory/province`)
      .then((r) => r.json())
      .then((json) => setProvinces(json.data ?? []))
      .catch(() => setError('No se pudo cargar la lista de provincias.'))
      .finally(() => setLoadingProvinces(false));
  }, []);

  // Cargar ciudades cuando cambia la provincia
  function handleProvinceChange(id: string) {
    setProvinceId(id);
    setCityId('');
    setBarrioId('');
    setCities([]);
    setNeighborhoods([]);

    if (!id) return;
    setLoadingCities(true);

    fetch(`${apiUrl}/api/territory/city?provinceId=${id}`)
      .then((r) => r.json())
      .then((json) => setCities(json.data ?? []))
      .catch(() => setError('No se pudo cargar la lista de ciudades.'))
      .finally(() => setLoadingCities(false));
  }

  // Cargar barrios cuando cambia la ciudad
  function handleCityChange(id: string) {
    setCityId(id);
    setBarrioId('');
    setNeighborhoods([]);

    if (!id) return;
    setLoadingNeighborhoods(true);

    fetch(`${apiUrl}/api/territory/neighborhood?cityId=${id}`)
      .then((r) => r.json())
      .then((json) => setNeighborhoods(json.data ?? []))
      .catch(() => setError('No se pudo cargar la lista de barrios.'))
      .finally(() => setLoadingNeighborhoods(false));
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!barrioId) {
      setError('Debes seleccionar un barrio.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/auth/register-leader`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          usuario: usuario.toLowerCase(),
          contrasena,
          barrioId: parseInt(barrioId, 10),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError(json.message ?? 'El usuario o el comité ya existe en este barrio.');
        } else if (res.status === 404) {
          setError('El barrio seleccionado no existe.');
        } else if (res.status === 400) {
          setError('Por favor verifica los datos ingresados.');
        } else {
          setError('Ha ocurrido un error inesperado. Intenta de nuevo.');
        }
        return;
      }

      window.location.href = '/login?registered=true';
    } catch {
      setError('No se pudo conectar con el servidor. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  }

  const selectClass =
    'bg-chalk border border-hairline rounded-lg px-3 py-3 text-sm text-graphite focus:outline-none focus:border-graphite transition-colors disabled:opacity-50 disabled:cursor-not-allowed appearance-none';

  return (
    <form onSubmit={handleSubmit} class="flex flex-col gap-4">
      {error && (
        <p class="text-sm text-graphite bg-mist border border-hairline rounded-lg px-3 py-2.5">
          {error}
        </p>
      )}

      {/* Nombre */}
      <div class="flex flex-col gap-1.5">
        <label for="reg-nombre" class="text-sm font-medium text-graphite">
          Nombre completo del líder
        </label>
        <input
          id="reg-nombre"
          type="text"
          value={nombre}
          onInput={(e) => setNombre((e.currentTarget as HTMLInputElement).value)}
          placeholder="Juan Pérez"
          required
          minLength={3}
          autocomplete="name"
          class="bg-chalk border border-hairline rounded-lg px-3 py-3 text-sm text-graphite placeholder:text-concrete focus:outline-none focus:border-graphite transition-colors"
        />
      </div>

      {/* Usuario */}
      <div class="flex flex-col gap-1.5">
        <label for="reg-usuario" class="text-sm font-medium text-graphite">
          Usuario
        </label>
        <input
          id="reg-usuario"
          type="text"
          value={usuario}
          onInput={(e) => setUsuario((e.currentTarget as HTMLInputElement).value)}
          placeholder="juan_perez"
          required
          minLength={3}
          pattern="^[a-z0-9_]+$"
          autocomplete="username"
          class="bg-chalk border border-hairline rounded-lg px-3 py-3 text-sm text-graphite placeholder:text-concrete focus:outline-none focus:border-graphite transition-colors"
        />
        <span class="text-xs text-concrete">Solo letras minúsculas, números y guión bajo.</span>
      </div>

      {/* Contraseña */}
      <div class="flex flex-col gap-1.5">
        <label for="reg-contrasena" class="text-sm font-medium text-graphite">
          Contraseña
        </label>
        <input
          id="reg-contrasena"
          type="password"
          value={contrasena}
          onInput={(e) => setContrasena((e.currentTarget as HTMLInputElement).value)}
          placeholder="Mínimo 6 caracteres"
          required
          minLength={6}
          autocomplete="new-password"
          class="bg-chalk border border-hairline rounded-lg px-3 py-3 text-sm text-graphite placeholder:text-concrete focus:outline-none focus:border-graphite transition-colors"
        />
      </div>

      {/* Separador territorio */}
      <div class="border-t border-hairline pt-2">
        <p class="text-xs font-medium text-concrete uppercase tracking-widest mb-3">
          Ubicación del nuevo comité
        </p>

        {/* Provincia */}
        <div class="flex flex-col gap-1.5 mb-3">
          <label for="reg-provincia" class="text-sm font-medium text-graphite">
            Provincia
          </label>
          <select
            id="reg-provincia"
            value={provinceId}
            onChange={(e) => handleProvinceChange((e.currentTarget as HTMLSelectElement).value)}
            required
            disabled={loadingProvinces}
            class={selectClass}
          >
            <option value="">
              {loadingProvinces ? 'Cargando provincias...' : 'Selecciona una provincia'}
            </option>
            {provinces.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Ciudad */}
        <div class="flex flex-col gap-1.5 mb-3">
          <label for="reg-ciudad" class="text-sm font-medium text-graphite">
            Ciudad / Cantón
          </label>
          <select
            id="reg-ciudad"
            value={cityId}
            onChange={(e) => handleCityChange((e.currentTarget as HTMLSelectElement).value)}
            required
            disabled={!provinceId || loadingCities}
            class={selectClass}
          >
            <option value="">
              {loadingCities
                ? 'Cargando ciudades...'
                : !provinceId
                  ? 'Primero selecciona una provincia'
                  : 'Selecciona una ciudad'}
            </option>
            {cities.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Barrio */}
        <div class="flex flex-col gap-1.5">
          <label for="reg-barrio" class="text-sm font-medium text-graphite">
            Barrio
          </label>
          <select
            id="reg-barrio"
            value={barrioId}
            onChange={(e) => setBarrioId((e.currentTarget as HTMLSelectElement).value)}
            required
            disabled={!cityId || loadingNeighborhoods}
            class={selectClass}
          >
            <option value="">
              {loadingNeighborhoods
                ? 'Cargando barrios...'
                : !cityId
                  ? 'Primero selecciona una ciudad'
                  : 'Selecciona un barrio'}
            </option>
            {neighborhoods.map((n) => (
              <option key={n.id} value={String(n.id)}>
                {n.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !barrioId}
        class="bg-graphite text-chalk text-sm font-medium rounded-lg px-4 py-3 hover:bg-carbon disabled:opacity-50 transition-colors mt-1 cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? 'Registrando...' : 'Fundar comité barrial'}
      </button>
    </form>
  );
}
