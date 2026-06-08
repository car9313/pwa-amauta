import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  login,
  register,
  getParentDashboard,
  getStudentProgress,
  getTeacherDashboard,
  logout,
} from "@/features/auth/infrastructure/services/auth.service";
import type {
  ParentDashboard,
  StudentProgress,
  TeacherDashboard,
} from "@/features/exercises/domain/exercise.types";
import type { AuthResponse } from "../domain/types";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";
import { authKeys } from "@/lib/query/keys";
import { saveAuthResponse } from "../infrastructure/auth-storage";
import {
  redirectToDashboard,
  redirectToRoles,
} from "../presentation/routing/auth-navigation";
import { mapHttpErrorToAuthError, type AuthError } from "../domain/auth-error";
import {
  withTimeout,
  LOGIN_TIMEOUT_MESSAGE,
  REGISTER_TIMEOUT_MESSAGE,
} from "@/lib/async/withTimeout";
import type { RegisterFormValues } from "../domain/register-form.types";
import type { LoginFormValues } from "../domain/login-form.types";

const LOGIN_TIMEOUT_MS = 8_000;
const REGISTER_TIMEOUT_MS = 8_000;

function toAuthError(error: unknown): AuthError {
  return mapHttpErrorToAuthError(error, navigator.onLine);
}

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  const setAuthError = useAuthStore((state) => state.setAuthError);

  const mutation = useMutation<AuthResponse, AuthError, LoginFormValues>({
    mutationFn: async (credentials) => {
      try {
        const result = await withTimeout(
          login(credentials),
          LOGIN_TIMEOUT_MS,
          LOGIN_TIMEOUT_MESSAGE,
        );
        return result;
      } catch (error) {
        throw toAuthError(error);
      }
    },
    onSuccess: async (result) => {
      console.log(result);
      setAuthError(null);
      await saveAuthResponse(result);
      setAuthenticated(true);
      setUser(result.user);
      queryClient.setQueryData(authKeys.session(), result.user);

      if (result.user.role) {
        redirectToDashboard(navigate, result.user.role);
      } else {
        redirectToRoles(navigate);
      }
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.warn("[useLogin] failed:", error.code, error.message);
      }
    },
  });

  return {
    login: mutation.mutate,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export function useRegister() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  const setAuthError = useAuthStore((state) => state.setAuthError);

  const mutation = useMutation<AuthResponse, AuthError, RegisterFormValues>({
    mutationFn: async (input) => {
      try {
        const result = await withTimeout(
          register(input),
          REGISTER_TIMEOUT_MS,
          REGISTER_TIMEOUT_MESSAGE,
        );
        return result;
      } catch (error) {
        throw toAuthError(error);
      }
    },
    onSuccess: async (result) => {
      setAuthError(null);
      await saveAuthResponse(result);
      setAuthenticated(true);
      setUser(result.user);
      queryClient.setQueryData(authKeys.session(), result.user);

      if (result.user.role) {
        redirectToDashboard(navigate, result.user.role);
      } else {
        redirectToRoles(navigate);
      }
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.warn("[useRegister] failed:", error.code, error.message);
      }
    },
  });

  return {
    register: mutation.mutate,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);

  const mutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: async () => {
      setAuthenticated(false);
      setUser(null);
      await queryClient.clear();
      queryClient.setQueryData(authKeys.session(), null);
      navigate("/login", { replace: true });
    },
    onError: async () => {
      setAuthenticated(false);
      setUser(null);
      await queryClient.clear();
      queryClient.setQueryData(authKeys.session(), null);
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

export function useTeacherDashboard() {
  const user = useAuthStore((state) => state.user);
  const teacherId = user?.role === "teacher" ? user.teacherId : null;

  return useQuery<TeacherDashboard, Error>({
    queryKey: authKeys.teacherDashboard(
      teacherId ?? "",
      user?.tenantId ?? null,
    ),
    queryFn: () => getTeacherDashboard(teacherId ?? ""),
    staleTime: Number(import.meta.env.VITE_QUERY_STALE_TIME ?? 60) * 1000,
    enabled: !!teacherId && !!user?.tenantId,
  });
}

export function useStudentProgress(studentId?: string) {
  const user = useAuthStore((state) => state.user);
  const selectedStudentId = useAuthStore((state) => state.selectedStudentId);

  const targetStudentId = studentId ?? selectedStudentId;

  return useQuery<StudentProgress, Error>({
    queryKey: authKeys.studentProgress(
      targetStudentId ?? "",
      user?.tenantId ?? null,
    ),
    queryFn: () => getStudentProgress(targetStudentId ?? ""),
    staleTime: Number(import.meta.env.VITE_QUERY_STALE_TIME ?? 60) * 1000,
    enabled: !!targetStudentId && !!user?.tenantId,
  });
}
