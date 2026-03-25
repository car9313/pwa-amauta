export type UserRole = "student" | "parent";

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole | null;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
}