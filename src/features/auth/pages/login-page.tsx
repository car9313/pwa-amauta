import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAuthStore } from "@/features/auth/store/auth-store";
import { getDashboardPath } from "@/features/auth/utils/get-dashboard-path";
import { loginUseCase } from "../application/auth.use-cases";

const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);
  const selectedRole = useAuthStore((state) => state.selectedRole);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setRole = useAuthStore((state) => state.setRole);
   const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });


  useEffect(() => {
    if (!hasHydrated) return;

    if (isAuthenticated && role) {
      navigate(getDashboardPath(role), { replace: true });
    }
  }, [hasHydrated, isAuthenticated, role, navigate]);

  const onSubmit = async (values: LoginFormValues) => {
try{
    const result = await loginUseCase(values)
   
    setAuthenticated(true);
    setUser(result.user)
    /* setRole(session.user.role); 
     */
  const resolvedRole = selectedRole ?? result.user.role ?? null;

    
    /* if (selectedRole) {
      setRole(selectedRole);
      navigate(getDashboardPath(selectedRole), { replace: true });
      return;
    } */

   /*  if (role) {
      navigate(getDashboardPath(role), { replace: true });
      return;
    } */
   if (resolvedRole) {
        setRole(resolvedRole);
        navigate(getDashboardPath(resolvedRole), { replace: true });
        return;
      }

    navigate("/roles", { replace: true });
    }
    catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo iniciar sesión";

      setError("password", {
        type: "manual",
        message,
      });
    }
  };

  if (!hasHydrated) {
    return null;
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center px-4 py-6 sm:px-6 lg:px-8">
      <Card className="w-full border-border/70 shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold text-amauta-blue">
            Iniciar sesión
          </CardTitle>
          <CardDescription>
            Accede a tu cuenta para continuar en Amauta
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
               className="w-full bg-amauta-orange text-white hover:bg-amauta-orange/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Validando..." : "Entrar"}
            </Button>
                 <button
          type="button"
          onClick={()=>navigate("/register", { replace: true })}
          className="w-full text-center text-muted-foreground hover:text-foreground transition-colors"
        >
          Registrarme soy nuevo
        </button>
 
          </form>
        </CardContent>
      </Card>
    </section>
  );
}