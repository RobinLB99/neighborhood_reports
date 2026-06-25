import { useEffect, useState } from 'preact/hooks';

interface User {
  id: number;
  nombre: string;
  usuario: string;
  rol: string;
  barrioId: number | null;
}

interface UseAuthOptions {
  apiUrl: string;
  requireAuth?: boolean;
}

export default function useAuth({ apiUrl, requireAuth = false }: UseAuthOptions) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('auth_user');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      const cached = localStorage.getItem('auth_user');
      if (token && cached) {
        return false; // No bloquear la interfaz si ya hay token y caché
      }
    }
    return true;
  });
  const [error, setError] = useState<string | null>(null);

  function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    window.location.href = '/login';
  }

  useEffect(() => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      setLoading(false);
      if (requireAuth) {
        window.location.href = '/login';
      }
      return;
    }

    fetch(`${apiUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          logout();
          throw new Error('Sesión expirada');
        }
        if (!res.ok) {
          throw new Error('Error de validación del servidor');
        }
        return res.json();
      })
      .then((json) => {
        if (json && json.data) {
          setUser(json.data);
          localStorage.setItem('auth_user', JSON.stringify(json.data));
        }
      })
      .catch((err) => {
        setError(err.message);
        // Si no se puede validar y no tenemos caché de usuario, forzar redirección
        if (requireAuth && !localStorage.getItem('auth_token')) {
          // Ya se ejecutó logout
          return;
        }
        if (requireAuth && !cachedUser) {
          window.location.href = '/login';
        }
      })
      .finally(() => setLoading(false));
  }, [apiUrl, requireAuth]);

  return {
    user,
    loading,
    error,
    logout,
  };
}
