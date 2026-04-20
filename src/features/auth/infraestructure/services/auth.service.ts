import { authAdapter } from "../mappers/adapter";
import type { ParentDashboard, StudentProgress } from "../../../exercises/domain/exercise.types";
import type { LoginFormValues } from "../../domain/login-form.types";
import type { RegisterFormValues } from "../../domain/register-form.types";
import { httpClient } from "@/lib/http/client";

const USE_MOCKS = import.meta.env.VITE_USE_MOCK === "true";
/* const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const VERSION = import.meta.env.VITE_API_VERSION ?? "v1";
const API_URL = `${API_BASE_URL}/${VERSION}`;

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = authAdapter.getToken();
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
}
 */
function delay<T>(data: T, ms = 600): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

const mockParentDashboard: ParentDashboard = {
  parent: {
    parentId: "par_001",
    name: "Ana María",
    email: "ana@ejemplo.com",
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
  childrenOverview: [
    {
      studentId: "stu_001",
      name: "Mario",
      level: 2,
      points: 156,
      precision: 85,
      streakDays: 4,
    },
    {
      studentId: "stu_002",
      name: "Lucía",
      level: 3,
      points: 234,
      precision: 92,
      streakDays: 7,
    },
  ],
  recentActivity: [
    {
      id: "act_001",
      studentId: "stu_001",
      childName: "Mario",
      action: "Completó lección",
      subject: "Matemáticas - Fracciones",
      timestamp: "Hace 30 minutos",
    },
    {
      id: "act_002",
      studentId: "stu_002",
      childName: "Lucía",
      action: "Alcanzó nivel 3",
      subject: "Álgebra básica",
      timestamp: "Hace 2 horas",
    },
  ],
};

const mockStudentProgress: StudentProgress = {
  studentId: "stu_001",
  studentName: "Mario",
  overallProgress: 72,
  subjects: [
    { subjectId: "math", subjectName: "Matemáticas", mastery: 75, lastPractice: "Hoy" },
    { subjectId: "spanish", subjectName: "Español", mastery: 85, lastPractice: "Ayer" },
    { subjectId: "science", subjectName: "Ciencias", mastery: 60, lastPractice: "Hace 2 días" },
  ],
  achievements: [],
  weakAreas: [],
};

export const login = async (credentials: LoginFormValues) => {
  console.log(credentials)
  return authAdapter.login(credentials);
};

export const register = async (input: RegisterFormValues) => {
  return authAdapter.register(input);
};

export const logout = async () => {
  return authAdapter.logout();
};

export const getParentDashboard = async (parentId: string): Promise<ParentDashboard> => {
  if (USE_MOCKS || !import.meta.env.VITE_API_BASE_URL) {
    return delay(mockParentDashboard);
  }
  return httpClient.request<ParentDashboard>(`/parents/${parentId}/dashboard`);
};

export const getStudentProgress = async (studentId: string): Promise<StudentProgress> => {
  if (USE_MOCKS || !import.meta.env.VITE_API_BASE_URL) {
    return delay({ ...mockStudentProgress, studentId });
  }
  return httpClient.request<StudentProgress>(`/students/${studentId}/progress`);
};

export const addChild = async (parentId: string, input: { name: string; email: string; password: string }) => {
  return authAdapter.addChild(parentId, input);
};