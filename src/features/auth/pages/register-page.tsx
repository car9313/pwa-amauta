import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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

import { useAuthStore } from "../store/auth-store";
import { getDashboardPath } from "../utils/get-dashboard-path";
import RegisterUseCase from "../application/register.use-case";

const registerSchema = z
  .object({
    name: z.string().min(2, "Nombre requerido"),
    email: z.string().email("Correo inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);
  const selectedRole = useAuthStore((s) => s.selectedRole);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const setRole = useAuthStore((s) => s.setRole);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!hasHydrated) return;

    if (isAuthenticated && role) {
      navigate(getDashboardPath(role), { replace: true });
    }
  }, [hasHydrated, isAuthenticated, role, navigate]);

  const onSubmit = async (values: RegisterFormValues) => {
    const session = await RegisterUseCase().execute({
      name: values.name,
      email: values.email,
      password: values.password,
    });

    setAuthenticated(true);

    if (selectedRole) {
      setRole(selectedRole);
      navigate(getDashboardPath(selectedRole), { replace: true });
      return;
    }

    if (session.user.role) {
      setRole(session.user.role);
      navigate(getDashboardPath(session.user.role), { replace: true });
      return;
    }

    navigate("/roles", { replace: true });
  };

  if (!hasHydrated) return null;

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
              <Label>Nombre</Label>
              <Input placeholder="Tu nombre" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input placeholder="correo@ejemplo.com" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Confirmar contraseña</Label>
              <Input
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