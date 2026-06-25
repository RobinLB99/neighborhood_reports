import { useState, useRef, useEffect } from 'preact/hooks';
import useAuth from '@modules/auth/application/useAuth';
import IncidentsFeed from '@modules/incidents/ui/IncidentsFeed';

interface Props {
  apiUrl: string;
}

export default function Dashboard({ apiUrl }: Props) {
  const { user, loading, logout } = useAuth({ apiUrl, requireAuth: true });
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

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
      <header class="sticky top-0 border-b border-hairline bg-chalk z-50">
        <div class="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-sm font-semibold text-graphite">Reportes Barriales</span>
            <span class="text-hairline">|</span>
            <span class="text-xs text-concrete">Guayaquil</span>
          </div>

          <div class="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-transparent hover:border-hairline hover:bg-mist transition-colors cursor-pointer select-none"
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
            >
              <div class="w-8 h-8 rounded-full bg-mist flex items-center justify-center border border-hairline shrink-0">
                <svg class="w-4 h-4 text-concrete" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span class="text-sm font-medium text-graphite max-w-[100px] sm:max-w-[150px] truncate">
                {user.nombre}
              </span>
              <svg class={`w-4 h-4 text-concrete transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isMenuOpen && (
              <div class="absolute right-0 mt-2 w-64 bg-chalk border border-hairline rounded-xl shadow-subtle-2 z-50 py-2">
                <div class="px-4 py-3 border-b border-hairline">
                  <p class="text-xs text-concrete mb-0.5">Sesión iniciada como</p>
                  <p class="text-sm font-semibold text-graphite truncate">{user.nombre}</p>
                  <p class="text-xs text-concrete truncate">@{user.usuario}</p>
                </div>
                <div class="px-4 py-3 border-b border-hairline space-y-2">
                  <div>
                    <p class="text-[10px] uppercase tracking-wider text-concrete">Rol</p>
                    <p class="text-xs font-medium text-graphite capitalize">{user.rol}</p>
                  </div>
                  <div>
                    <p class="text-[10px] uppercase tracking-wider text-concrete">Barrio</p>
                    <p class="text-xs font-medium text-graphite">
                      {user.barrioId ? `ID ${user.barrioId}` : 'Sin asignar'}
                    </p>
                  </div>
                </div>
                <div class="p-1">
                  <button
                    onClick={logout}
                    class="w-full text-left px-3 py-2 rounded-lg text-sm text-concrete hover:text-graphite hover:bg-mist transition-colors cursor-pointer select-none"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

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
