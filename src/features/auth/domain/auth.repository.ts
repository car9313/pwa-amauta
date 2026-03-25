/* import type { AuthCredentials, AuthSession, RegisterData } from "./auth.types";

export interface AuthRepository {
  login(credentials: AuthCredentials): Promise<AuthSession>;
  register(data: RegisterData): Promise<AuthSession>;
} */

  import type { AuthCredentials, AuthResult, RegisterInput } from "./auth.types";

export type AuthRepository = {
  login: (input: AuthCredentials) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  logout?: () => Promise<void>;
};