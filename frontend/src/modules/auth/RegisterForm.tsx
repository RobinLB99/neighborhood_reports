import { useState } from 'preact/hooks';

interface Props {
  apiUrl: string;
}

export default function RegisterForm({ apiUrl }: Props) {
  const [nombre, setNombre] = useState('');
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [barrioId, setBarrioId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const barrioIdNum = parseInt(barrioId, 10);
    if (isNaN(barrioIdNum) || barrioIdNum < 1) {
      setError('El ID del barrio debe ser un número entero positivo.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/committee/register-first`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          usuario: usuario.toLowerCase(),
          contrasena,
          barrioId: barrioIdNum,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError(json.message ?? 'El nombre de usuario o el comité ya existe en este barrio.');
        } else if (res.status === 404) {
          setError('El barrio indicado no existe. Verifica el ID.');
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

  return (
    <form onSubmit={handleSubmit} class="flex flex-col gap-4">
      {error && (
        <p class="text-sm text-graphite bg-mist border border-hairline rounded-lg px-3 py-2.5">
          {error}
        </p>
      )}

      <div class="flex flex-col gap-1.5">
        <label for="reg-nombre" class="text-sm font-medium text-graphite">
          Nombre completo
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

      <div class="flex flex-col gap-1.5">
        <label for="reg-barrio" class="text-sm font-medium text-graphite">
          ID del Barrio
        </label>
        <input
          id="reg-barrio"
          type="number"
          value={barrioId}
          onInput={(e) => setBarrioId((e.currentTarget as HTMLInputElement).value)}
          placeholder="1"
          required
          min={1}
          class="bg-chalk border border-hairline rounded-lg px-3 py-3 text-sm text-graphite placeholder:text-concrete focus:outline-none focus:border-graphite transition-colors"
        />
        <span class="text-xs text-concrete">Identificador numérico del barrio donde se funda el comité.</span>
      </div>

      <button
        type="submit"
        disabled={loading}
        class="bg-graphite text-chalk text-sm font-medium rounded-lg px-4 py-3 hover:bg-carbon disabled:opacity-50 transition-colors mt-1 cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? 'Registrando comité...' : 'Fundar comité barrial'}
      </button>
    </form>
  );
}
