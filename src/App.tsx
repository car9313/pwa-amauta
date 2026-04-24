import { ErrorBoundary } from "@/components/error";
import { AppRoutes } from "./routes/app-routes";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";

export default function App() {
  const user = useAuthStore((state) => state.user);

  const fallbackType = user?.role === "student" ? "student" : user?.role === "parent" ? "parent" : "generic";

  return (
    <ErrorBoundary fallbackType={fallbackType}>
      <AppRoutes />
    </ErrorBoundary>
  );
}