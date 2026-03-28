import type { UserRole } from "../presentation/store/auth-store";

export type AuthCredentials = {
  email: string;
  password: string;
}

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole | null;
}

export type AuthResult = {
  user: AuthUser;
  token: string;
};
