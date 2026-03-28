import type { AuthCredentials, AuthResult, RegisterInput } from "./auth.types";

export type AuthRepository = {
  login: (input: AuthCredentials) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  logout: () => Promise<void>;
};