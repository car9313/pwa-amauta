import { useAuthStore } from '@/features/auth/presentation/store/auth-store';
import { Sparkles } from 'lucide-react';
import { useAuthInitializer } from '../../hooks/useAuthInitializer';
import { useQueryInitializer } from '@/features/queries/hooks/useQueryInitializer';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const isVerifying = useAuthStore((s) => s.isVerifying);
  useAuthInitializer();
  
  const queryState = useQueryInitializer();

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-amber-50 to-orange-50">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#f4701f]/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-full bg-[#f4701f]/30 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-[#f4701f] animate-spin" />
          </div>
        </div>
        <p className="ml-4 text-[#f4701f] font-medium">Verificando sesión...</p>
      </div>
    );
  }

  if (queryState.isLoading && !queryState.hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-amber-50 to-orange-50">
        <div className="relative flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#f4701f] animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-[#f4701f] animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-[#f4701f] animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <p className="ml-4 text-[#f4701f] font-medium">Cargando datos...</p>
      </div>
    );
  }

  return <>{children}</>;
}