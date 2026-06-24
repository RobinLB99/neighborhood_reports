import useAuth from '@modules/auth/application/useAuth';

interface Props {
  apiUrl: string;
}

export default function Dashboard({ apiUrl }: Props) {
  const { user, loading, logout } = useAuth({ apiUrl, requireAuth: true });


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

        {(user.rol === 'lider' || user.rol === 'miembro') && (
          <div class="mt-8 bg-chalk border border-hairline rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 class="text-base font-semibold text-graphite">Gestión de la Directiva</h3>
              <p class="text-sm text-concrete">
                Consulta los miembros del comité y asigna cargos como Secretario o Vocal.
              </p>
            </div>
            <a
              href="/dashboard/miembros"
              class="bg-graphite text-chalk text-sm font-medium rounded-lg px-4 py-2.5 hover:bg-carbon transition-colors inline-block whitespace-nowrap cursor-pointer text-center"
            >
              Ver Directiva
            </a>
          </div>
        )}
      </main>

      {user.barrioId && (
        <a
          href="/dashboard/reportar"
          class="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-graphite text-chalk rounded-full flex items-center justify-center shadow-lg hover:bg-carbon hover:-translate-y-1 hover:shadow-xl transition-all duration-300 z-50 group"
          aria-label="Reportar nueva incidencia"
        >
          <svg class="w-6 h-6 transition-transform group-hover:rotate-90 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </a>
      )}
    </div>
  );
}
