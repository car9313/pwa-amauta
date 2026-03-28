import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
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
import { useLoginActions } from "../hooks/use-login-actions";
import { createFormErrorHandler } from "../errors/create-form-error-handler";
import { loginSchema, type LoginFormValues } from "../../domain/login-form.types";
import { AuthLoadingScreen } from "../components/loading/auth-loading-screen";


export function LoginPage() {
  const navigate = useNavigate();
  const { login, isReady } = useLoginActions();
  
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

  const handleAuthError = createFormErrorHandler<LoginFormValues>({
    setError,
    field: "password",
    fallbackMessage: "No se pudo iniciar sesión",
  });
    const onSubmit = async (values: LoginFormValues): Promise<void> => {
    try {
      await login(values);
    } catch (error) {
      handleAuthError(error);
    }
  };
   if (!isReady) {
    return <AuthLoadingScreen />;
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
              onClick={() => navigate("/register", { replace: true })}
              className="w-full text-center text-muted-foreground transition-colors hover:text-foreground"
            >
              Registrarme soy nuevo
            </button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}