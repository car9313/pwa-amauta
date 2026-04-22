import type { Exercise, ExerciseResult, SubmitAnswerPayload, StudentDashboard } from "@/features/exercises/domain/exercise.types";
import { saveExercise, getAllExercises } from "@/lib/api/storage/exercises-db";

const USE_MOCKS = import.meta.env.VITE_USE_MOCK === "true";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const API_VERSION = import.meta.env.VITE_API_VERSION ?? "v1";
const API_URL = `${API_BASE_URL}/${API_VERSION}`;

function getToken(): string | null {
  return localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY ?? "amauta_token");
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
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
}

function delay<T>(data: T, ms = 800): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

const mockExercises: Exercise[] = [
  {
    exerciseId: "ex_001",
    type: "VISUAL_ADDITION",
    topicId: "math_addition",
    prompt: "Resuelve: 5 + 3 = ?",
    answerType: "NUMERIC",
    difficulty: "LOW",
    hints: ["Cuenta con tus dedos", "Sumar es agregar"],
    feedbackStyle: "ENCOURAGING",
  },
  {
    exerciseId: "ex_002",
    type: "VISUAL_SUBTRACTION",
    topicId: "math_subtraction",
    prompt: "Resuelve: 8 - 3 = ?",
    answerType: "NUMERIC",
    difficulty: "LOW",
    hints: ["Cuenta hacia atras"],
    feedbackStyle: "ENCOURAGING",
  },
  {
    exerciseId: "ex_003",
    type: "VISUAL_MULTIPLICATION",
    topicId: "math_multiplication",
    prompt: "Resuelve: 4 x 2 = ?",
    answerType: "NUMERIC",
    difficulty: "MEDIUM",
    hints: ["Multiplicar es sumar varias veces"],
    feedbackStyle: "ENCOURAGING",
  },
];

let mockInitialized = false;

async function ensureMockExercises() {
  if (mockInitialized) return;
  const existing = await getAllExercises();
  if (existing.length === 0) {
    await saveExercise({
      id: "ex_001",
      title: "Addition Basics",
      type: "math",
      difficulty: 1,
      points: 10,
      content: mockExercises[0],
      subject: "math",
    });
    await saveExercise({
      id: "ex_002",
      title: "Subtraction Basics",
      type: "math",
      difficulty: 1,
      points: 10,
      content: mockExercises[1],
      subject: "math",
    });
    await saveExercise({
      id: "ex_003",
      title: "Multiplication Basics",
      type: "math",
      difficulty: 2,
      points: 15,
      content: mockExercises[2],
      subject: "math",
    });
  }
  mockInitialized = true;
}

const mockExerciseResult: ExerciseResult = {
  attemptId: "att_001",
  score: 100,
  passed: true,
  mistakes: [],
  feedbackSummary: "¡Excelente trabajo!",
  nextAction: {
    action: "ADVANCE",
    topicId: "math_addition",
    pedagogy: "VISUAL",
  },
};

const mockStudentDashboard: StudentDashboard = {
  student: {
    studentId: "stu_001",
    name: "Mario",
    avatar: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop",
    level: 2,
    points: 156,
    precision: 85,
    streakDays: 4,
    streakWeek: [true, true, true, true, false, false, false],
  },
  agenda: [],
  progress: [],
  recentAchievements: [],
};

export async function getNextExercise(studentId: string): Promise<Exercise> {
  if (USE_MOCKS || !API_BASE_URL) {
    await ensureMockExercises();
    const exercises = await getAllExercises();
    const random = exercises.length > 0
      ? exercises[Math.floor(Math.random() * exercises.length)]
      : null;
    const exercise = random
      ? (random.content as Exercise)
      : mockExercises[0];
    return delay({ ...exercise, exerciseId: random?.id ?? "ex_001" });
  }

  return fetchApi<Exercise>(`/students/${studentId}/next-exercise`);
}

export async function submitAnswer(
  studentId: string,
  payload: SubmitAnswerPayload
): Promise<ExerciseResult> {
  if (USE_MOCKS || !API_BASE_URL) {
    return delay(mockExerciseResult);
  }

  return fetchApi<ExerciseResult>(
    `/students/${studentId}/exercises/${payload.exerciseId}/submit`,
    {
      method: "POST",
      body: JSON.stringify({ answer: payload.answer }),
    }
  );
}

export async function getStudentDashboard(studentId: string): Promise<StudentDashboard> {
  if (USE_MOCKS || !API_BASE_URL) {
    return delay({ ...mockStudentDashboard, student: { ...mockStudentDashboard.student, studentId } });
  }

  return fetchApi<StudentDashboard>(`/students/${studentId}/dashboard`);
}