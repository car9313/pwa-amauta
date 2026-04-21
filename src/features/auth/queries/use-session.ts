import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../presentation/store/auth-store";
import { authKeys } from "@/lib/query/keys";
import {
  loadAuthFromStorage,
  checkAuthValidity,
  clearAuth,
  saveAuthResponse,
} from "../infrastructure/auth-storage";
import { refreshAccessToken } from "@/lib/api/refresh";
import {
  loginApi,
  registerApi,
  logoutApi,
} from "./auth-api";
import type { LoginFormValues } from "../domain/login-form.types";
import type { RegisterFormValues } from "../domain/register-form.types";

export function useSession() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const setUser = useAuthStore((state) => state.setUser);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  const sessionQuery = useQuery({
    queryKey: authKeys.session(),
    queryFn: async () => {
      const isValid = await checkAuthValidity();
      if (!isValid) {
        return null;
      }
      const stored = await loadAuthFromStorage();
      return stored?.user ?? null;
    },
    staleTime: 1000 * 60 * 5,
    enabled: hasHydrated,
    retry: 1,
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginFormValues) => loginApi(credentials),
    onSuccess: (result) => {
      saveAuthResponse(result);
      setAuthenticated(true);
      setUser(result.user);
      queryClient.setQueryData(authKeys.session(), result.user);
      const role = result.user.role;
      if (role === "student") {
        navigate("/student/dashboard", { replace: true });
      } else if (role === "parent") {
        navigate("/parent/dashboard", { replace: true });
      } else if (role === "teacher") {
        navigate("/teacher/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: (input: RegisterFormValues) => registerApi(input),
    onSuccess: (result) => {
      saveAuthResponse(result);
      setAuthenticated(true);
      setUser(result.user);
      queryClient.setQueryData(authKeys.session(), result.user);
      const role = result.user.role;
      if (role === "student") {
        navigate("/student/dashboard", { replace: true });
      } else if (role === "parent") {
        navigate("/parent/dashboard", { replace: true });
      } else if (role === "teacher") {
        navigate("/teacher/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => logoutApi(),
    onSuccess: async () => {
      await clearAuth();
      await queryClient.clear();
      queryClient.setQueryData(authKeys.session(), null);
      navigate("/login", { replace: true });
    },
    onError: async () => {
      await clearAuth();
      await queryClient.clear();
      queryClient.setQueryData(authKeys.session(), null);
      navigate("/login", { replace: true });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: () => refreshAccessToken(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
    onError: async () => {
      await clearAuth();
      queryClient.setQueryData(authKeys.session(), null);
      navigate("/login", { replace: true });
    },
  });

  return {
    user,
    isAuthenticated,
    isLoading:
      loginMutation.isPending ||
      registerMutation.isPending ||
      logoutMutation.isPending ||
      sessionQuery.isLoading,
    isRefreshing: refreshMutation.isPending,
    error:
      loginMutation.error?.message ??
      registerMutation.error?.message ??
      sessionQuery.error?.message ??
      null,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    refresh: refreshMutation.mutate,
    sessionQuery,
  };
}

export function useCurrentUser() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return { user, isAuthenticated };
}