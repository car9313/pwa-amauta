// src/features/auth/pages/register-page.tsx
import { Link } from "react-router-dom";
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


import { useRegisterActions } from "../hooks/use-register-actions";
import { createFormErrorHandler } from "../errors/create-form-error-handler";
import { registerSchema, type RegisterFormValues } from "../../domain/register-form.types";
import { AuthLoadingScreen } from "../components/loading/auth-loading-screen";

export function RegisterPage() {
  const { register: registerUser, isReady } = useRegisterActions();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleAuthError = createFormErrorHandler<RegisterFormValues>({
    setError,
    field: "email",
    fallbackMessage: "No se pudo registrar",
  });

  const onSubmit = async (values: RegisterFormValues): Promise<void> => {
    try {
      await registerUser(values);
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
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-amauta-blue">
            Crear cuenta
          </CardTitle>
          <CardDescription>
            Regístrate para comenzar en Amauta
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Tu nombre"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-amauta-orange text-white hover:bg-amauta-orange/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creando..." : "Registrarme"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link
                to="/login"
                className="font-medium text-amauta-blue hover:underline"
              >
                Inicia sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}