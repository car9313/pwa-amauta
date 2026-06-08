import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, Loader2, WifiOff } from "lucide-react";
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
import { loginFormSchema, type LoginFormValues } from "../../domain/login-form.types";
import { AuthLoadingScreen } from "../components/loading/auth-loading-screen";
import { FormErrorBanner } from "../components/FormErrorBanner";
import { useAuthStore } from "../store/auth-store";
import { useLogin } from "@/features/auth/hooks/useAuth";
import { useOnlineStatus } from "@/features/auth/hooks/useOnlineStatus";
import { getStoredUser } from "@/lib/api/storage/auth-db";
import type { AuthError } from "../../domain/auth-error";
import { cn } from "@/lib/utils";

function getFriendlyError(error: AuthError | null): {
  banner: AuthError | null;
  field: string | null;
} {
  if (!error) return { banner: null, field: null };

  switch (error.code) {
    case "NETWORK_ERROR":
    case "TIMEOUT":
    case "REFRESH_FAILED":
      return { banner: error, field: null };
    case "TOKEN_INVALID":
    case "TOKEN_REVOKED":
    case "TOKEN_EXPIRED":
    case "SESSION_NOT_FOUND":
      return { banner: null, field: "password" };
    default:
      return { banner: error, field: null };
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const { login, isLoading, error, reset } = useLogin();
  const isOnline = useOnlineStatus();
  const [isVisible] = useState(true);
  const [lastUserName, setLastUserName] = useState<string | null>(null);
  const [lastSubmitted, setLastSubmitted] = useState<LoginFormValues | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStoredUser()
      .then((stored) => {
        if (cancelled) return;
        setLastUserName(stored?.user?.name ?? null);
      })
      .catch(() => {
        if (!cancelled) setLastUserName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [hasHydrated]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (isOnline && error) {
      reset();
    }
  }, [isOnline, error, reset]);

  useEffect(() => {
    if (!error) {
      setError("password", { type: "manual", message: undefined });
      return;
    }
    const { field } = getFriendlyError(error);
    if (field === "password") {
      const friendly =
        error.code === "TOKEN_REVOKED" || error.code === "TOKEN_EXPIRED"
          ? "Tu sesión fue cerrada. Inicia sesión de nuevo."
          : "No encontramos tu cuenta. ¿Está bien escrito tu correo?";
      setError("password", { type: "manual", message: friendly });
    } else {
      setError("password", { type: "manual", message: undefined });
    }
  }, [error, setError]);

  const offlineWelcome = useMemo(() => {
    if (isOnline) return null;
    if (lastUserName) {
      return `¡Hola de nuevo, ${lastUserName}! Vuelve a tener internet para jugar.`;
    }
    return "No tienes internet. Vuelve cuando tengas conexión para empezar a jugar.";
  }, [isOnline, lastUserName]);

  const onSubmit = (values: LoginFormValues): void => {
    setLastSubmitted(values);
    login(values);
  };

  const handleRetry = (): void => {
    if (!lastSubmitted) return;
    login({ ...lastSubmitted });
  };

  if (!hasHydrated) {
    return <AuthLoadingScreen />;
  }

  const friendly = getFriendlyError(error);
  const submitDisabled = isLoading || !isOnline;

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center px-4 py-6">
      <div className="gradient-mesh absolute inset-0 -z-10" />

      <div className="absolute right-1/4 top-1/4 h-64 w-64 rounded-full bg-[#1f4fa3]/10 blur-3xl animate-float-gentle hidden sm:block" />
      <div className="absolute left-1/4 bottom-1/4 h-48 w-48 rounded-full bg-[#f4701f]/10 blur-3xl animate-float-gentle-reverse hidden sm:block" style={{ animationDelay: '2s' }} />

      <Card className={cn(
        "w-full max-w-md border-0 shadow-2xl",
        "transition-all duration-700 ease-out",
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
      )}>
        <CardHeader className="space-y-3 text-center pt-8">
          <div className={cn(
            "mx-auto mb-2 w-20 h-20 sm:w-24 sm:h-24 relative",
            "transition-all duration-700 delay-100",
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          )}>
            <img
              src="/img/amauta-mascot.jpg"
              alt="Amauta"
              className="w-full h-full object-cover rounded-2xl shadow-lg shadow-[#1f4fa3]/30"
            />
          </div>

          <CardTitle className={cn(
            "text-2xl sm:text-3xl font-bold tracking-tight text-[#1f4fa3]",
            "transition-all duration-500 delay-200",
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          )}>
            ¡Bienvenido a Amauta!
          </CardTitle>

          <CardDescription className={cn(
            "text-sm sm:text-base transition-all duration-500 delay-300",
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          )}>
            Inicia sesión para continuar tu aprendizaje
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
            {!isOnline && offlineWelcome && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
              >
                <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p className="leading-snug">{offlineWelcome}</p>
              </div>
            )}

            {friendly.banner && (
              <FormErrorBanner error={friendly.banner} onRetry={handleRetry} />
            )}

            <div className={cn(
              "space-y-2 transition-all duration-500 delay-400",
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}>
              <Label htmlFor="email" className="text-slate-700 font-semibold text-sm sm:text-base">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                className="h-10 sm:h-11 border-slate-200 bg-slate-50/50 focus:bg-white transition-all duration-200 focus:ring-2 focus:ring-[#1f4fa3]/20 focus:border-[#1f4fa3] text-sm sm:text-base"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className={cn(
              "space-y-2 transition-all duration-500 delay-500",
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}>
              <Label htmlFor="password" className="text-slate-700 font-semibold text-sm sm:text-base">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-10 sm:h-11 border-slate-200 bg-slate-50/50 focus:bg-white transition-all duration-200 focus:ring-2 focus:ring-[#1f4fa3]/20 focus:border-[#1f4fa3] text-sm sm:text-base"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className={cn(
                "w-full h-11 sm:h-12 text-sm sm:text-base font-bold",
                "bg-linear-to-r from-[#f4701f] to-[#ea601b]",
                "hover:from-[#ea601b] hover:to-[#d45518]",
                "shadow-lg shadow-orange-500/25",
                "transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/30 hover:scale-[1.02]",
                "disabled:opacity-70 disabled:hover:scale-100",
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
              disabled={submitDisabled}
              aria-disabled={submitDisabled}
              title={!isOnline ? "Necesitas internet para iniciar sesión" : undefined}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  Conectando...
                </span>
              ) : !isOnline ? (
                <span className="flex items-center gap-2">
                  <WifiOff className="h-4 w-4" />
                  Sin internet
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Entrar
                </span>
              )}
            </Button>

            <button
              type="button"
              onClick={() => navigate("/register", { replace: true })}
              className={cn(
                "w-full text-center text-sm font-medium text-slate-500",
                "transition-all duration-500 delay-600",
                "hover:text-[#1f4fa3] hover:underline decoration-2 underline-offset-2",
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
            >
              ¿No tienes cuenta? <span className="font-semibold">Regístrate</span>
            </button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
