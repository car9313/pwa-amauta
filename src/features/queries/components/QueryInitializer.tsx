import { useQueryInitializer } from "../hooks/useQueryInitializer";
import { AmautaLoadingState } from "@/components/amauta";

interface QueryInitializerProps {
  children: React.ReactNode;
  loadingClassName?: string;
}

export function QueryInitializer({
  children,
  loadingClassName,
}: QueryInitializerProps) {
  const { isLoading, hasHydrated } = useQueryInitializer();

  if (isLoading && !hasHydrated) {
    return (
      <div className={loadingClassName}>
        <AmautaLoadingState variant="page" />
      </div>
    );
  }

  return <>{children}</>;
}