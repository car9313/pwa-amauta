import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { login, register, getParentDashboard, getStudentProgress, logout } from "@/features/auth/infraestructure/services/auth.service";
import type { ParentDashboard, StudentProgress } from "@/features/exercises/domain/exercise.types";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";
import { authKeys } from "@/lib/query/keys";
import { redirectToDashboard, redirectToRoles } from "@/features/auth/presentation/routing/auth-navigation";
import type { RegisterFormValues } from "../domain/register-form.types";
import type { LoginFormValues } from "../domain/login-form.types";

export function useLogin() {
  const navigate = useNavigate();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);

  const mutation = useMutation({
    mutationFn: (credentials: LoginFormValues) => login(credentials),
    onSuccess: (result) => {
        console.log('[useLogin] onSuccess, setting user');
      setAuthenticated(true);
      setUser(result.user);

      if (result.user.role) {
        redirectToDashboard(navigate, result.user.role);
      } else {
        redirectToRoles(navigate);
      }
    },
  });

  return {
    login: mutation.mutate,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

export function useRegister() {
  const navigate = useNavigate();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);

  const mutation = useMutation({
    mutationFn: (input: RegisterFormValues) => register(input),
    onSuccess: (result) => {
      setAuthenticated(true);
      setUser(result.user);

      if (result.user.role) {
        redirectToDashboard(navigate, result.user.role);
      } else {
        redirectToRoles(navigate);
      }
    },
  });

  return {
    register: mutation.mutate,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);

  const mutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      // 1. Limpiar store de Zustand
      clearSession();
      // 2. Limpiar toda la caché de React Query
      queryClient.clear();
      // 3. Redirigir a /login (replace evita volver atrás a rutas protegidas)
      navigate("/login", { replace: true });
    },
  });

  return {
    logout: mutation.mutate,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

export function useParentDashboard() {
  const user = useAuthStore((state) => state.user);
  const parentId = user?.role === "parent" ? user.parentId : null;

  return useQuery<ParentDashboard, Error>({
    queryKey: authKeys.parentDashboard(parentId ?? "", user?.tenantId ?? null),
    queryFn: () => getParentDashboard(parentId ?? ""),
    staleTime: Number(import.meta.env.VITE_QUERY_STALE_TIME ?? 60) * 1000,
    enabled: !!parentId && !!user?.tenantId,
  });
}

export function useStudentProgress(studentId?: string) {
  const user = useAuthStore((state) => state.user);
  const selectedStudentId = useAuthStore((state) => state.selectedStudentId);

  const targetStudentId = studentId ?? selectedStudentId;

  return useQuery<StudentProgress, Error>({
    queryKey: authKeys.studentProgress(targetStudentId ?? "", user?.tenantId ?? null),
    queryFn: () => getStudentProgress(targetStudentId ?? ""),
    staleTime: Number(import.meta.env.VITE_QUERY_STALE_TIME ?? 60) * 1000,
    enabled: !!targetStudentId && !!user?.tenantId,
  });
}
