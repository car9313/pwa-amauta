import type {
  Exercise,
  ExerciseResult,
  SubmitAnswerPayload,
  StudentDashboard,
} from "@/features/exercises/domain/exercise.types";
import { saveExercise, getAllExercises } from "@/lib/api/storage/exercises-db";
import { httpClient } from "@/lib/http/client";

const USE_MOCKS = import.meta.env.VITE_USE_MOCK === "true";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

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

const mockExcellentResult: ExerciseResult = {
  attemptId: `att_${Date.now()}`,
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

const mockGoodResult: ExerciseResult = {
  attemptId: `att_${Date.now()}`,
  score: 75,
  passed: true,
  mistakes: [{ type: "CALCULATION_ERROR", severity: 0.3 }],
  feedbackSummary: "¡Buen intento! Revisa los signos.",
  nextAction: {
    action: "REINFORCE",
    topicId: "math_addition",
    pedagogy: "TEXT",
  },
};

const mockFailedResult: ExerciseResult = {
  attemptId: `att_${Date.now()}`,
  score: 40,
  passed: false,
  mistakes: [{ type: "SIGN_ERROR", severity: 0.6 }],
  feedbackSummary: "Casi, revisa si es suma o resta.",
  nextAction: {
    action: "REMEDIATE",
    topicId: "math_addition",
    pedagogy: "VISUAL",
  },
};

function getMockResult(payload: SubmitAnswerPayload): ExerciseResult {
  const answer = parseInt(payload.answer, 10);

  if (isNaN(answer) || answer < 0) {
    return { ...mockFailedResult, attemptId: `att_${Date.now()}` };
  }

  if (answer > 10) {
    return { ...mockExcellentResult, attemptId: `att_${Date.now()}` };
  }

  if (answer > 5) {
    return { ...mockGoodResult, attemptId: `att_${Date.now()}` };
  }

  return { ...mockFailedResult, attemptId: `att_${Date.now()}` };
}

const mockStudentDashboard: StudentDashboard = {
  student: {
    studentId: "stu_001",
    name: "Mario",
    avatar:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop",
    level: 2,
    points: 156,
    precision: 85,
    streakDays: 4,
    streakWeek: [true, true, true, true, false, false, false],
  },
  agenda: [],
  progress: [
    { topicId: "math_addition", title: "Sumas", mastery: 85 },
    { topicId: "math_subtraction", title: "Restas", mastery: 62 },
    { topicId: "math_multiplication", title: "Multiplicación", mastery: 38 },
    { topicId: "math_division", title: "División", mastery: 15 },
  ],
  recentAchievements: [],
};

export async function getNextExercise(studentId: string): Promise<Exercise> {
  if (USE_MOCKS || !API_BASE_URL) {
    await ensureMockExercises();
    const exercises = await getAllExercises();
    const random =
      exercises.length > 0
        ? exercises[Math.floor(Math.random() * exercises.length)]
        : null;
    const exercise = random ? (random.content as Exercise) : mockExercises[0];
    return delay({ ...exercise, exerciseId: random?.id ?? "ex_001" });
  }

  return httpClient.get<Exercise>(`/students/${studentId}/next-exercise`);
}

export async function submitAnswer(
  studentId: string,
  payload: SubmitAnswerPayload,
): Promise<ExerciseResult> {
  if (USE_MOCKS || !API_BASE_URL) {
    return delay(getMockResult(payload));
  }

  return httpClient.post<ExerciseResult>(
    `/students/${studentId}/exercises/${payload.exerciseId}/submit`,
    { answer: payload.answer },
  );
}

export async function getStudentDashboard(
  studentId: string,
): Promise<StudentDashboard> {
  if (USE_MOCKS || !API_BASE_URL) {
    return delay({
      ...mockStudentDashboard,
      student: { ...mockStudentDashboard.student, studentId },
    });
  }

  return httpClient.get<StudentDashboard>(`/students/${studentId}/dashboard`);
}
