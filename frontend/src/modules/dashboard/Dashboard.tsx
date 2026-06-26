import { useState, useEffect } from 'preact/hooks';
import useAuth from '@modules/auth/application/useAuth';
import IncidentsFeed from '@modules/incidents/ui/IncidentsFeed';
import AppHeader from '@shared/components/ui/AppHeader';

interface Props {
  apiUrl: string;
}

export default function Dashboard({ apiUrl }: Props) {
  const { user, loading, logout } = useAuth({ apiUrl, requireAuth: true });
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 300);
    }
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      <AppHeader user={user} onLogout={logout} pageTitle="Guayaquil" />

      <main class="max-w-5xl mx-auto px-6 py-12">
        {(user.rol === 'lider' || user.rol === 'miembro') && (
          <div class="mb-8 bg-chalk border border-hairline rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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

        {user.barrioId && (
          <IncidentsFeed apiUrl={apiUrl} token={token} userRole={user.rol} currentUserId={user.id} />
        )}
      </main>

      {user.barrioId && (
        <div class="fixed bottom-6 right-6 md:bottom-8 md:right-8 flex flex-col gap-4 z-50">
          <button
            onClick={scrollToTop}
            class={`w-12 h-12 self-end bg-chalk border border-hairline text-graphite rounded-full flex items-center justify-center shadow-md hover:bg-mist transition-all duration-300 ${
              showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
            aria-label="Volver arriba"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>

          <a
            href="/dashboard/reportar"
            class="w-14 h-14 bg-graphite text-chalk rounded-full flex items-center justify-center shadow-lg hover:bg-carbon hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group"
            aria-label="Reportar nueva incidencia"
          >
            <svg class="w-6 h-6 transition-transform group-hover:rotate-90 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
