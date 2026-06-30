import { useTranslation } from "react-i18next";
import { useAuthStore } from '@/features/auth/presentation/store/auth-store';
import { useAuthInitializer } from '../../hooks/useAuthInitializer';
import { useQueryInitializer } from '@/features/queries/hooks/useQueryInitializer';
import { AmautaLoadingState } from '@/components/amauta';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const isVerifying = useAuthStore((s) => s.isVerifying);
  useAuthInitializer();
  
  const queryState = useQueryInitializer();

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-warning/10 to-accent/10">
        <AmautaLoadingState variant="page" label={t("auth:initializer.verifying")} />
      </div>
    );
  }

  if (queryState.isLoading && !queryState.hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-warning/10 to-accent/10">
        <AmautaLoadingState variant="page" label={t("auth:initializer.loading")} />
      </div>
    );
  }

  return <>{children}</>;
}