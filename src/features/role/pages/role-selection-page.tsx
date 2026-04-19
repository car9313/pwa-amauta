import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardPath } from "@/features/auth/presentation/routing/auth-navigation";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";
import { RoleCard } from "./components/role-card";

export function RoleSelectionPage() {
  const navigate = useNavigate();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;

    if (isAuthenticated && user?.role) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [hasHydrated, isAuthenticated, user, navigate]);

  const handleSelectRole = (nextRole: "student" | "parent") => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    navigate(getDashboardPath(nextRole), { replace: true });
  };

  if (!hasHydrated) {
    return null;
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex w-full max-w-md flex-col gap-4 sm:max-w-lg md:max-w-xl">
        <RoleCard
          title="Soy"
          highlight="Estudiante"
          imageSrc="/student.jpg"
          imageAlt="Estudiante"
          accentClassName="border-amauta-orange/20"
          onSelect={() => handleSelectRole("student")}
        />

        <RoleCard
          title="Soy"
          highlight="Padre o Madre"
          imageSrc="/parent.jpg"
          imageAlt="Padre o madre"
          accentClassName="border-amauta-blue/20"
          onSelect={() => handleSelectRole("parent")}
        />
      </div>
    </section>
  );
}
