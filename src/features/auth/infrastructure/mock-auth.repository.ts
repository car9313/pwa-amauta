// src/features/auth/infrastructure/mock-auth.repository.ts
import type { AuthRepository } from "../domain/auth.repository";
import type {
  AuthCredentials,
  AuthResult,
  RegisterInput,
  AuthUser,
} from "../domain/auth.types";

type MockUserRecord = AuthUser & {
  password: string;
};

const USERS_KEY = "amauta-mock-users";

const DEFAULT_USERS: MockUserRecord[] = [
  {
    id: "1",
    name: "Mario Estudiante",
    email: "student@amauta.com",
    password: "123456",
    role: "student",
  },
  {
    id: "2",
    name: "Laura Parent",
    email: "parent@amauta.com",
    password: "123456",
    role: "parent",
  },
  {
    id: "3",
    name: "Luis Not Role",
    email: "notrole@amauta.com",
    password: "123456",
    role: null,
  },
];

function sleep(ms = 700) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function loadUsers(): MockUserRecord[] {
  const storage = getStorage();
  if (!storage) return DEFAULT_USERS;

  const raw = storage.getItem(USERS_KEY);

  if (!raw) {
    storage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }

  try {
    const parsed = JSON.parse(raw) as MockUserRecord[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_USERS;
  } catch {
    storage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
}

function saveUsers(users: MockUserRecord[]) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(USERS_KEY, JSON.stringify(users));
}

function toAuthResult(user: MockUserRecord): AuthResult {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token: `mock-token-${user.id}`,
  };
}

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const mockAuthRepository: AuthRepository = {
  async login(input: AuthCredentials) {
    await sleep();

    const users = loadUsers();
    const user = users.find(
      (item) =>
        item.email.toLowerCase() === input.email.toLowerCase() &&
        item.password === input.password
    );

    if (!user) {
      throw new Error("Credenciales inválidas");
    }

    return toAuthResult(user);
  },

  async register(input: RegisterInput) {
    await sleep();

    const users = loadUsers();
    const exists = users.some(
      (item) => item.email.toLowerCase() === input.email.toLowerCase()
    );

    if (exists) {
      throw new Error("Ya existe una cuenta con ese correo");
    }

    const newUser: MockUserRecord = {
      id: createId(),
      name: input.name,
      email: input.email,
      password: input.password,
      role: null,
    };

    const nextUsers = [...users, newUser];
    saveUsers(nextUsers);

    return toAuthResult(newUser);
  },
  async logout() {
    await sleep(300);
    // en mock no hacemos nada
  },
};