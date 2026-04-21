import { z } from "zod";
import type {
  AuthResponse,
  AddChildRequest,
  ChildResponse,
} from "../../domain/types";
import { addChildRequestSchema } from "../../domain/types";
import { loginFormSchema, type LoginFormValues } from "../../domain/login-form.types";
import { registerFormSchema, type RegisterFormValues } from "../../domain/register-form.types";
import { httpClient } from "@/lib/http/client";
import { saveAuthResponse, clearAuth, getAccessToken, getStoredToken } from "../../infrastructure/auth-storage";

const USE_MOCKS = import.meta.env.VITE_USE_MOCK === "true";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const ACCESS_TOKEN_EXPIRY = 900;
/* 
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = error.message ?? `Error ${response.status}`;
    throw new Error(message);
  }

  return response.json();
} */

function delay<T>(data: T, ms = 800): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues.map((e) => e.message).join(", ");
    throw new Error(message);
  }
  return result.data;
}

const MOCK_USERS: Record<string, { password: string; data: AuthResponse["user"]; tenantId: string }> = {
  "student@amauta.com": {
    password: "123456",
    data: {
      name: "Mario Estudiante",
      email: "student@amauta.com",
      role: "student",
      studentId: "stu_001",
      tenantId: "tenant_001",
    },
    tenantId: "tenant_001",
  },
  "parent@amauta.com": {
    password: "123456",
    data: {
      name: "Ana María",
      email: "parent@amauta.com",
      role: "parent",
      parentId: "par_001",
      tenantId: "tenant_001",
      children: [
        {
          studentId: "stu_001",
          name: "Mario",
          avatar: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop",
          level: 2,
          points: 156,
          precision: 85,
          streakDays: 4,
        },
        {
          studentId: "stu_002",
          name: "Lucía",
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
          level: 3,
          points: 234,
          precision: 92,
          streakDays: 7,
        },
      ],
    },
    tenantId: "tenant_001",
  },
  "teacher@amauta.com": {
    password: "123456",
    data: {
      name: "Profesor Carlos",
      email: "teacher@amauta.com",
      role: "teacher",
      teacherId: "tea_001",
      classIds: ["cls_001", "cls_002"],
      tenantId: "tenant_001",
    },
    tenantId: "tenant_001",
  },
};

function mockLogin(credentials: LoginFormValues): AuthResponse {
  const normalizedEmail = credentials.email.toLowerCase();
  const mockUser = MOCK_USERS[normalizedEmail];

  if (!mockUser || mockUser.password !== credentials.password) {
    throw new Error("Credenciales inválidas");
  }

  const identifier = mockUser.data.role === "student" 
    ? mockUser.data.studentId 
    : mockUser.data.role === "parent" 
      ? mockUser.data.parentId 
      : mockUser.data.teacherId;

  return {
    user: mockUser.data,
    token: `mock_token_${identifier}_${Date.now()}`,
    refresh: `mock_refresh_${identifier}_${Date.now()}`,
    expiresIn: ACCESS_TOKEN_EXPIRY,
    tenantId: mockUser.tenantId,
  };
}

function mockRegister(input: RegisterFormValues): AuthResponse {
  const normalizedEmail = input.email.toLowerCase();

  if (MOCK_USERS[normalizedEmail]) {
    throw new Error("Ya existe una cuenta con ese correo");
  }

  const parentId = `par_${Date.now()}`;
  const newUser: AuthResponse["user"] = {
    name: input.name,
    email: normalizedEmail,
    role: "parent",
    parentId,
    tenantId: "tenant_001",
    children: [],
  };

return {
    user: newUser,
    token: `mock_token_${parentId}_${Date.now()}`,
    refresh: `mock_refresh_${parentId}_${Date.now()}`,
    expiresIn: ACCESS_TOKEN_EXPIRY,
    tenantId: "tenant_001",
  };
}

const mockChildren: AuthResponse["user"][] = [];

function mockAddChild(_parentId: string, input: AddChildRequest): ChildResponse {
  const studentId = `stu_${Date.now()}`;
  const newChild: AuthResponse["user"] = {
    name: input.name,
    email: input.email,
    role: "student",
    studentId: studentId,
    tenantId: "tenant_001",
  };
  mockChildren.push(newChild);
  return {
    studentId,
    name: input.name,
    avatar: undefined,
    level: 1,
    points: 0,
    precision: 0,
    streakDays: 0,
  };
}

export interface AuthAdapter {
  login: (credentials: LoginFormValues) => Promise<AuthResponse>;
  register: (input: RegisterFormValues) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  addChild: (parentId: string, input: AddChildRequest) => Promise<ChildResponse>;
  me: () => Promise<AuthResponse['user']>;
}

const realAdapter: AuthAdapter = {

  async login(credentials) {
    const validated = validateInput(loginFormSchema, credentials);
    const response = await httpClient.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(validated),
    });
    await saveAuthResponse(response);
    return response;
  },

  async register(input) {
    const validated = validateInput(registerFormSchema, input);
    const response = await httpClient.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(validated),
    });
    await saveAuthResponse(response);
    return response;
  },

   async logout() {
     try {
       await httpClient.request("/auth/logout", { method: "POST" });
     } finally {
       await clearAuth();
     }
   },

  getToken: () => {
    return getAccessToken();
  },

  async addChild(_parentId, input) {
    const validated = validateInput(addChildRequestSchema, input) as AddChildRequest;
    return httpClient.request<ChildResponse>(`/parents/${_parentId}/children`, {
      method: "POST",
      body: JSON.stringify(validated),
    });
  },

  async me() {
    return httpClient.request<AuthResponse['user']>('/auth/me');
  },
};

const mockAdapter: AuthAdapter = {
  async login(credentials) {
    await delay(null, 800 + Math.random() * 700);
    const validated = validateInput(loginFormSchema, credentials) as LoginFormValues;
    const response = mockLogin(validated);
    await saveAuthResponse(response);
    return response;
  },

  async register(input) {
    await delay(null, 800 + Math.random() * 700);
    const validated = validateInput(registerFormSchema, input) as RegisterFormValues;
    const response = mockRegister(validated);
    await saveAuthResponse(response);
    return response;
  },

   async logout() {
     await delay(null, 300);
     await clearAuth();
   },

  getToken: () => {
    return getAccessToken();
  },

  async addChild(_parentId, input) {
    await delay(null, 800 + Math.random() * 700);
    const validated = validateInput(addChildRequestSchema, input) as AddChildRequest;
    return mockAddChild(_parentId, validated);
  },

  async me() {
    await delay(null, 300);
    const stored = await getStoredToken();
    if (!stored) {
      throw new Error('No token stored');
    }
    return {
      name: 'Mock User',
      email: 'mock@amauta.com',
      role: 'parent' as const,
      parentId: 'mock_parent',
      tenantId: 'tenant_001',
      children: [],
    };
  },
};

export function createAuthAdapter(): AuthAdapter {
  if (USE_MOCKS || !API_BASE_URL) {
    console.debug("[AuthAdapter] Using mock adapter");
    return mockAdapter;
  }
  console.debug("[AuthAdapter] Using real adapter");
  return realAdapter;
}

export const authAdapter = createAuthAdapter();