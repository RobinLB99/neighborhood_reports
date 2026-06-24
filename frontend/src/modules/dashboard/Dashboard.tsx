import { useEffect, useState } from 'preact/hooks';

interface User {
  id: number;
  nombre: string;
  usuario: string;
  rol: string;
  barrioId: number | null;
}

interface Props {
  apiUrl: string;
}

export default function Dashboard({ apiUrl }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      window.location.href = '/login';
      return;
    }

    fetch(`${apiUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          window.location.href = '/login';
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (json) setUser(json.data);
      })
      .catch(() => {
        window.location.href = '/login';
      })
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
  }

  if (loading) {
    return (
      <div class="min-h-screen bg-chalk flex items-center justify-center">
        <p class="text-sm text-concrete">Cargando...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div class="min-h-screen bg-chalk">
      <header class="border-b border-hairline bg-chalk">
        <div class="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-sm font-semibold text-graphite">Reportes Barriales</span>
            <span class="text-hairline">|</span>
            <span class="text-xs text-concrete">Guayaquil</span>
          </div>
          <button
            onClick={logout}
            class="text-sm text-concrete hover:text-graphite transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main class="max-w-5xl mx-auto px-6 py-12">
        <div class="mb-10">
          <p class="text-xs font-medium text-concrete uppercase tracking-widest mb-2">
            Bienvenido de vuelta
          </p>
          <h1 class="text-3xl font-semibold text-graphite">
            {user.nombre}
          </h1>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-chalk border border-hairline rounded-xl p-5">
            <p class="text-xs text-concrete mb-1">Usuario</p>
            <p class="text-sm font-medium text-graphite">@{user.usuario}</p>
          </div>

          <div class="bg-chalk border border-hairline rounded-xl p-5">
            <p class="text-xs text-concrete mb-1">Rol</p>
            <p class="text-sm font-medium text-graphite capitalize">{user.rol}</p>
          </div>

          <div class="bg-chalk border border-hairline rounded-xl p-5">
            <p class="text-xs text-concrete mb-1">Barrio</p>
            <p class="text-sm font-medium text-graphite">
              {user.barrioId ? `ID ${user.barrioId}` : 'Sin asignar'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
