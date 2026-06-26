import { useState, useEffect } from 'preact/hooks';
import useAuth from '@modules/auth/application/useAuth';
import CommitteeMembersList from './CommitteeMembersList';
import RegisterMemberForm from './RegisterMemberForm';
import AppHeader from '@shared/components/ui/AppHeader';

interface Props {
  apiUrl: string;
}

export default function CommitteeManager({ apiUrl }: Props) {
  const { user, loading, logout } = useAuth({ apiUrl, requireAuth: true });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  function triggerRefresh() {
    setRefreshTrigger((prev) => prev + 1);
  }

  if (loading) {
    return (
      <div class="min-h-screen bg-chalk flex items-center justify-center">
        <p class="text-sm text-concrete">Cargando...</p>
      </div>
    );
  }

  if (!user) return null;

  // Si no es líder ni miembro, no puede administrar la directiva
  const isLider = user.rol === 'lider';
  const isMiembro = user.rol === 'miembro';

  if (!isLider && !isMiembro) {
    return (
      <div class="min-h-screen bg-chalk flex flex-col items-center justify-center p-6 text-center">
        <div class="max-w-md bg-chalk border border-hairline rounded-xl p-8">
          <h2 class="text-lg font-semibold text-graphite mb-2">Acceso restringido</h2>
          <p class="text-sm text-concrete mb-6">
            Solo el presidente (líder) y los miembros de la directiva del comité barrial pueden acceder a esta sección.
          </p>
          <a
            href="/dashboard"
            class="inline-block bg-graphite text-chalk text-sm font-medium rounded-lg px-5 py-2.5 hover:bg-carbon transition-colors"
          >
            Volver al dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-chalk">
      <AppHeader user={user} onLogout={logout} pageTitle="Gestión del Comité" />

      <main class="max-w-5xl mx-auto px-6 py-12">
        <div class="mb-10 flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <a
              href="/dashboard"
              class="text-xs font-medium text-concrete hover:text-graphite transition-colors flex items-center gap-1"
            >
              ← Dashboard
            </a>
          </div>
          <h1 class="text-3xl font-semibold text-graphite">Miembros del Comité</h1>
          <p class="text-sm text-concrete">
            Administra los roles directivos de tu barrio o visualiza a los representantes actuales.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Formulario solo visible para el líder */}
          {isLider && (
            <div class="lg:col-span-1">
              <RegisterMemberForm
                apiUrl={apiUrl}
                token={token}
                onMemberRegistered={triggerRefresh}
              />
            </div>
          )}

          {/* Lista de miembros, ocupa más espacio si no hay formulario */}
          <div class={isLider ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <CommitteeMembersList
              apiUrl={apiUrl}
              token={token}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
