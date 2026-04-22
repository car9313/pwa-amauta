import { useQueryInitializer } from "../hooks/useQueryInitializer";
import { cn } from "@/lib/utils";

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
      <div
        className={cn(
          "flex items-center justify-center min-h-[200px]",
          loadingClassName
        )}
      >
        <div className="relative flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#f4701f] animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-[#f4701f] animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-[#f4701f] animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}