import { useState } from 'preact/hooks';

interface Props {
  apiUrl: string;
}

export default function LoginForm({ apiUrl }: Props) {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuario.toLowerCase(), contrasena }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setError('El nombre de usuario o la contraseña son incorrectos.');
        } else if (res.status === 400) {
          setError('Por favor verifica los datos ingresados.');
        } else {
          setError('Ha ocurrido un error inesperado. Intenta de nuevo.');
        }
        return;
      }

      localStorage.setItem('auth_token', json.data.token);
      if (json.data.user) {
        localStorage.setItem('auth_user', JSON.stringify(json.data.user));
      }

      window.location.href = '/dashboard';
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
        <label for="login-usuario" class="text-sm font-medium text-graphite">
          Usuario
        </label>
        <input
          id="login-usuario"
          type="text"
          value={usuario}
          onInput={(e) => setUsuario((e.currentTarget as HTMLInputElement).value)}
          placeholder="tu_usuario"
          required
          minLength={3}
          autocomplete="username"
          class="bg-chalk border border-hairline rounded-lg px-3 py-3 text-sm text-graphite placeholder:text-concrete focus:outline-none focus:border-graphite transition-colors"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="login-contrasena" class="text-sm font-medium text-graphite">
          Contraseña
        </label>
        <input
          id="login-contrasena"
          type="password"
          value={contrasena}
          onInput={(e) => setContrasena((e.currentTarget as HTMLInputElement).value)}
          placeholder="••••••"
          required
          minLength={6}
          autocomplete="current-password"
          class="bg-chalk border border-hairline rounded-lg px-3 py-3 text-sm text-graphite placeholder:text-concrete focus:outline-none focus:border-graphite transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        class="bg-graphite text-chalk text-sm font-medium rounded-lg px-4 py-3 hover:bg-carbon disabled:opacity-50 transition-colors mt-1 cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </button>
    </form>
  );
}
