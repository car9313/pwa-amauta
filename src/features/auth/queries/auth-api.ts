import type { AuthUser } from "../domain/types";
import type { LoginFormValues } from "../domain/login-form.types";
import type { RegisterFormValues } from "../domain/register-form.types";
import type { AuthResponse } from "../domain/types";
import { authAdapter } from "../infraestructure/mappers/adapter";
import { httpClient } from "@/lib/http/client";

export interface SessionState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  isOffline: boolean;
  error: string | null;
}

export async function loginApi(credentials: LoginFormValues): Promise<AuthResponse> {
  const response = await authAdapter.login(credentials);
  return response;
}

export async function registerApi(input: RegisterFormValues): Promise<AuthResponse> {
  const response = await authAdapter.register(input);
  return response;
}

export async function logoutApi(): Promise<void> {
  await authAdapter.logout();
}

export async function refreshSessionApi(): Promise<AuthResponse> {
  const response = await httpClient.request<AuthResponse>("/auth/refresh", {
    method: "POST",
  });
  return response;
}

export async function fetchUserProfileApi(): Promise<AuthUser> {
  const response = await httpClient.request<AuthUser>("/auth/me");
  return response;
}
