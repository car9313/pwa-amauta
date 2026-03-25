import type { AuthCredentials, AuthSession, RegisterData } from "./auth.types";

export interface AuthRepository {
  login(credentials: AuthCredentials): Promise<AuthSession>;
  register(data: RegisterData): Promise<AuthSession>;
}