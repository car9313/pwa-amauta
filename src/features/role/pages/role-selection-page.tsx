import { useNavigate } from "react-router-dom";
import { Card} from "@/components/ui/card";
import { useAuthStore } from "../../auth/store/auth-store";
import { RoleCard } from "@/features/components/role-card";
import { getDashboardPath } from "@/features/auth/utils/get-dashboard-path";

export function RoleSelectionPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setSelectedRole = useAuthStore((state) => state.setSelectedRole);
  const setRole = useAuthStore((state) => state.setRole);

  const handleSelectRole = (role: "student" | "parent") => {
   setSelectedRole(role);
    setRole(role);

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    navigate(getDashboardPath(role));
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <section className="grid flex-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="relative mb-6 w-full">
              <div className="absolute inset-0 -z-10 rounded-full bg-amauta-blue-light blur-3xl" />
              <Card className="overflow-hidden border-border/60 bg-white/90 shadow-sm">
                <div className="flex justify-center items-center text-center space-y-4">  
                  <img
                    src="/img/amauta-mascot.jpg"
                    alt="Mascota Amauta"
                    className="h-36 w-36 object-contain animate-float sm:h-44 sm:w-44 lg:h-56 lg:w-56"
                  />
                </div>
              </Card>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-amauta-blue sm:text-4xl lg:text-5xl">
              ¡Hola! Soy Amauta.
            </h1>
              <p className="text-muted-foreground mt-2">¿Quién eres?</p>
            </div>

          <>
            
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1">
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
            
           {/*  <LoginForm onSubmit={handleLogin} />
           */}</>
        </section>
      </div>
    </main>
  );
}