"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Mail, Lock, ArrowRight, WifiOff, Loader2 } from "lucide-react";
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
import { FormErrorBanner } from "../components/FormErrorBanner";
import { registerFormSchema, type RegisterFormValues } from "../../domain/register-form.types";
import { AuthLoadingScreen } from "../components/loading/auth-loading-screen";
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
    return <AuthLoadingScreen />;
  }

  const submitDisabled = isLoading || !isOnline;
  const showBanner = !!error && (error.code === "NETWORK_ERROR" || error.code === "TIMEOUT" || error.code === "REFRESH_FAILED");

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center px-4 py-6">
      <div className="gradient-mesh absolute inset-0 -z-10" />

      <div className="absolute right-1/4 top-1/4 h-64 w-64 rounded-full bg-[#1f4fa3]/10 blur-3xl animate-float-gentle hidden sm:block" />
      <div className="absolute left-1/4 bottom-1/4 h-48 w-48 rounded-full bg-[#f4701f]/10 blur-3xl animate-float-gentle-reverse hidden sm:block" style={{ animationDelay: '2s' }} />
      <Card className={cn(
        "w-full max-w-md border-0 shadow-2xl transition-all duration-700 ease-out",
        isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
      )}>
        <CardHeader className="space-y-3 text-center pt-8">
          <div className={cn(
            "mx-auto mb-2 w-20 h-20 relative transition-all duration-700 delay-100",
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"
          )}>
            <img
              src="/img/amauta-mascot.jpg"
              alt="Amauta"
              className="w-full h-full object-cover rounded-2xl shadow-lg shadow-[#1f4fa3]/30"
            />
          </div>

          <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1f4fa3]">
            ¡Únete a Amauta!
          </CardTitle>

          <CardDescription className="text-sm sm:text-base">
            Crea tu cuenta para comenzar a aprender
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!isOnline && offlineMessage && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
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
              <Label htmlFor="name" className="text-slate-700 font-semibold text-sm">
                Nombre completo
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="name"
                  placeholder="Mario García"
                  className="pl-10 h-10 sm:h-11 border-slate-200 bg-slate-50/50 focus:bg-white transition-all duration-200 focus:ring-2 focus:ring-[#1f4fa3]/20"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-red-500 font-medium">{errors.name.message}</p>
              )}
            </div>

            <div className={cn(
              "space-y-2 transition-all duration-500 delay-300",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <Label htmlFor="email" className="text-slate-700 font-semibold text-sm">
                Correo electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  className="pl-10 h-10 sm:h-11 border-slate-200 bg-slate-50/50 focus:bg-white transition-all duration-200 focus:ring-2 focus:ring-[#1f4fa3]/20"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className={cn(
              "space-y-2 transition-all duration-500 delay-400",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <Label htmlFor="password" className="text-slate-700 font-semibold text-sm">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-10 sm:h-11 border-slate-200 bg-slate-50/50 focus:bg-white transition-all duration-200 focus:ring-2 focus:ring-[#1f4fa3]/20"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div className={cn(
              "space-y-2 transition-all duration-500 delay-500",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold text-sm">
                Confirmar contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-10 sm:h-11 border-slate-200 bg-slate-50/50 focus:bg-white transition-all duration-200 focus:ring-2 focus:ring-[#1f4fa3]/20"
                  aria-invalid={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={submitDisabled}
              aria-disabled={submitDisabled}
              title={!isOnline ? "Necesitas internet para crear una cuenta" : undefined}
              className={cn(
                "w-full h-11 sm:h-12 text-base font-bold mt-2",
                "bg-linear-to-r from-[#f4701f] to-[#ea601b]",
                "hover:from-[#ea601b] hover:to-[#d45518]",
                "shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30",
                "hover:scale-[1.02] transition-all duration-300",
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
            </Button>

            <p className={cn(
              "text-center text-sm font-medium text-slate-500 transition-all duration-500 delay-600",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-[#1f4fa3] hover:underline font-semibold">
                Inicia sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
