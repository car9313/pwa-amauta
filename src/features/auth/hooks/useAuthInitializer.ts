import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/presentation/store/auth-store';
import { authAdapter } from '../infraestructure/mappers/adapter';

export function useAuthInitializer() {
  const navigate = useNavigate();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setVerifying = useAuthStore((s) => s.setVerifying);
  const setUser = useAuthStore((s) => s.setUser);
  const clearSession = useAuthStore((s) => s.clearSession);

  const hasRun = useRef(false);

  useEffect(() => {
    if (!hasHydrated) return;

    // Si ya ejecutamos la verificación, no volver a hacerlo
    if (hasRun.current) return;

    const verify = async () => {
      // Si ya estamos autenticados, no necesitamos verificar
      if (isAuthenticated) {
        setVerifying(false);
        hasRun.current = true;
        return;
      }

      setVerifying(true);
      try {
        const user = await authAdapter.me();
        setUser(user);
        hasRun.current = true;
      } catch {
        // Solo limpiar si seguimos sin autenticar
        if (!useAuthStore.getState().isAuthenticated) {
          clearSession();
          navigate('/login', { replace: true });
        }
        hasRun.current = true;
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [hasHydrated, isAuthenticated]); // Dependencias mínimas, sin isVerifying
}