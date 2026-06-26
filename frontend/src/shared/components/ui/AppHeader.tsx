import { useState, useRef, useEffect } from 'preact/hooks';
import type { User } from '@modules/auth/application/useAuth';

interface Props {
  user: User;
  onLogout: () => void;
  pageTitle: string;
}

export default function AppHeader({ user, onLogout, pageTitle }: Props) {
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

  return (
    <header class="sticky top-0 border-b border-hairline bg-chalk z-50">
      <div class="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <a href="/dashboard" class="text-sm font-semibold text-graphite hover:underline">
            Reportes Barriales
          </a>
          <span class="text-hairline">|</span>
          <span class="text-xs text-concrete">{pageTitle}</span>
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
                  onClick={onLogout}
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
  );
}
