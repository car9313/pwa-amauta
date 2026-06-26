"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Mail, Lock, ArrowRight, WifiOff, Loader2 } from "lucide-react";
import {
  AmautaButton,
  AmautaCard,
  AmautaCardContent,
  AmautaCardDescription,
  AmautaCardHeader,
  AmautaCardTitle,
  AmautaInput,
  AmautaLabel,
} from "@/components/amauta";
import { FormErrorBanner } from "../components/FormErrorBanner";
import { registerFormSchema, type RegisterFormValues } from "../../domain/register-form.types";
import { AmautaLoadingState } from "@/components/amauta";
import { useAuthStore } from "../store/auth-store";
import { cn } from "@/lib/utils";
import { useRegister } from "../../hooks/useAuth";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import type { AuthError } from "../../domain/auth-error";

function friendlyMessageForField(error: AuthError): string {
  if (error.code === "TIMEOUT") {
    return "La conexión está muy lenta. ¿Lo intentamos de nuevo?";
  }
  if (error.code === "NETWORK_ERROR") {
    return "No pudimos crear tu cuenta. Revisa tu conexión e inténtalo de nuevo.";
  }
  if (error.code === "TOKEN_REVOKED" || error.code === "SESSION_NOT_FOUND") {
    return "Tu sesión fue cerrada. Crea una cuenta nueva.";
  }
  return error.message;
}

export function RegisterPage() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const { register: registerUser, isLoading, error, reset } = useRegister();
  const isOnline = useOnlineStatus();
  const [isVisible] = useState(true);
  const [lastSubmitted, setLastSubmitted] = useState<RegisterFormValues | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "parent",
    },
  });

  useEffect(() => {
    if (isOnline && error) {
      reset();
    }
  }, [isOnline, error, reset]);

  useEffect(() => {
    if (!error) {
      setError("email", { type: "manual", message: undefined });
      return;
    }
    setError("email", { type: "manual", message: friendlyMessageForField(error) });
  }, [error, setError]);

  const offlineMessage = useMemo(() => {
    if (isOnline) return null;
    return "No tienes internet. Vuelve cuando tengas conexión para crear tu cuenta.";
  }, [isOnline]);

  const onSubmit = (values: RegisterFormValues): void => {
    setLastSubmitted(values);
    registerUser(values);
  };

  const handleRetry = (): void => {
    if (!lastSubmitted) return;
    registerUser({ ...lastSubmitted });
  };

  if (!hasHydrated) {
    return <AmautaLoadingState variant="page" label="Preparando tu sesión..." />;
  }

  const submitDisabled = isLoading || !isOnline;
  const showBanner = !!error && (error.code === "NETWORK_ERROR" || error.code === "TIMEOUT" || error.code === "REFRESH_FAILED");

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center px-4 py-6">
      <div className="gradient-mesh absolute inset-0 -z-10" />

      <div className="absolute right-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-float-gentle hidden sm:block" />
      <div className="absolute left-1/4 bottom-1/4 h-48 w-48 rounded-full bg-accent/10 blur-3xl animate-float-gentle-reverse animation-delay-2000 hidden sm:block" />
      <AmautaCard className={cn(
        "w-full max-w-md border-0 shadow-2xl transition-all duration-700 ease-out",
        isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
      )}>
       <AmautaCardHeader className="space-y-3 text-center pt-8">
          <div className={cn(
            "mx-auto mb-2 w-20 h-20 sm:w-24 sm:h-32 relative",
            "transition-all duration-700 delay-100",
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          )}>
            <img
              src="/img/amauta-mascot.jpg"
              alt="Amauta"
              className="w-full h-full object-contain "
            />
          </div>

          <AmautaCardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
            ¡Únete a Amauta!
          </AmautaCardTitle>

          <AmautaCardDescription className="text-sm sm:text-base">
            Crea tu cuenta para comenzar a aprender
          </AmautaCardDescription>
        </AmautaCardHeader>

        <AmautaCardContent className="px-6 sm:px-8 pb-6 sm:pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!isOnline && offlineMessage && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent-foreground"
              >
                <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p className="leading-snug">{offlineMessage}</p>
              </div>
            )}

            {showBanner && error && (
              <FormErrorBanner error={error} onRetry={handleRetry} />
            )}

            <div className={cn(
              "space-y-2 transition-all duration-500 delay-200",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <AmautaLabel htmlFor="name" className="text-foreground font-semibold text-sm">
                Nombre completo
              </AmautaLabel>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <AmautaInput
                  id="name"
                  placeholder="Mario García"
                  className="pl-10 border-input bg-background/50 focus:bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-destructive font-medium">{errors.name.message}</p>
              )}
            </div>

            <div className={cn(
              "space-y-2 transition-all duration-500 delay-300",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <AmautaLabel htmlFor="email" className="text-foreground font-semibold text-sm">
                Correo electrónico
              </AmautaLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <AmautaInput
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  className="pl-10 border-input bg-background/50 focus:bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className={cn(
              "space-y-2 transition-all duration-500 delay-400",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <AmautaLabel htmlFor="password" className="text-foreground font-semibold text-sm">
                Contraseña
              </AmautaLabel>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <AmautaInput
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 border-input bg-background/50 focus:bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive font-medium">{errors.password.message}</p>
              )}
            </div>

            <div className={cn(
              "space-y-2 transition-all duration-500 delay-500",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <AmautaLabel htmlFor="confirmPassword" className="text-foreground font-semibold text-sm">
                Confirmar contraseña
              </AmautaLabel>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <AmautaInput
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 border-input bg-background/50 focus:bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  aria-invalid={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>

            <AmautaButton
              type="submit"
              size="child-lg"
              disabled={submitDisabled}
              aria-disabled={submitDisabled}
              title={!isOnline ? "Necesitas internet para crear una cuenta" : undefined}
              className={cn(
                "w-full mt-2",
                "bg-linear-to-r from-accent to-amauta-orange-dark",
                "hover:from-amauta-orange-dark hover:to-[#d45518]",
                "shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30",
                "hover:scale-105 active:scale-95 transition-all duration-300",
                "disabled:opacity-70 disabled:hover:scale-100",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando tu cuenta...
                </span>
              ) : !isOnline ? (
                <span className="flex items-center gap-2">
                  <WifiOff className="h-4 w-4" />
                  Sin internet
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Registrarme
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </AmautaButton>

            <p className={cn(
              "text-center text-sm font-medium text-muted-foreground transition-all duration-500 delay-600",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary hover:underline font-semibold">
                Inicia sesión
              </Link>
            </p>
          </form>
        </AmautaCardContent>
      </AmautaCard>
    </section>
  );
}
