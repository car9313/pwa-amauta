import type {
  Exercise,
  ExerciseResult,
  SubmitAnswerPayload,
  StudentDashboard,
} from "@/features/exercises/domain/exercise.types";
import { saveExercises, getAllExercises } from "@/lib/api/storage/exercises-db";
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
    answerType: "MULTIPLE_CHOICE",
    difficulty: "LOW",
    hints: ["Cuenta con tus dedos", "Sumar es agregar"],
    options: ["8", "6", "9", "7"],
    feedbackStyle: "ENCOURAGING",
  },
  {
    exerciseId: "ex_002",
    type: "VISUAL_SUBTRACTION",
    topicId: "math_subtraction",
    prompt: "Resuelve: 8 - 3 = ?",
    answerType: "MULTIPLE_CHOICE",
    difficulty: "LOW",
    hints: ["Cuenta hacia atras"],
    options: ["5", "6", "4", "3"],
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
  await saveExercises([
    {
      id: "ex_001",
      title: "Addition Basics",
      type: "math",
      difficulty: 1,
      points: 10,
      content: mockExercises[0],
      subject: "math",
    },
    {
      id: "ex_002",
      title: "Subtraction Basics",
      type: "math",
      difficulty: 1,
      points: 10,
      content: mockExercises[1],
      subject: "math",
    },
    {
      id: "ex_003",
      title: "Multiplication Basics",
      type: "math",
      difficulty: 2,
      points: 15,
      content: mockExercises[2],
      subject: "math",
    },
  ]);
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

const mockFailedResult: ExerciseResult = {
  attemptId: `att_${Date.now()}`,
  score: 40,
  passed: false,
  mistakes: [{ type: "SIGN_ERROR", severity: 0.6 }],
  feedbackSummary: "Casi, revisa la operación e inténtalo de nuevo.",
  nextAction: {
    action: "REMEDIATE",
    topicId: "math_addition",
    pedagogy: "VISUAL",
  },
};

const MOCK_ANSWER_KEY: Record<string, string> = {
  ex_001: "8",
  ex_002: "5",
  ex_003: "8",
};

function getMockResult(payload: SubmitAnswerPayload): ExerciseResult {
  const expected = MOCK_ANSWER_KEY[payload.exerciseId];
  const isCorrect = expected !== undefined && payload.answer.trim() === expected;
  const attemptId = `att_${Date.now()}`;

  return isCorrect
    ? { ...mockExcellentResult, attemptId }
    : { ...mockFailedResult, attemptId };
}

const MOCK_STEP_TOTAL = 3;
const mockStepCounter: Record<string, number> = {};

function nextMockStep(topicId: string): Pick<Exercise, "stepCurrent" | "stepTotal"> {
  const next = (mockStepCounter[topicId] ?? 0) + 1;
  mockStepCounter[topicId] = next;

  return {
    stepCurrent: Math.min(next, MOCK_STEP_TOTAL),
    stepTotal: MOCK_STEP_TOTAL,
  };
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
    return delay({
      ...exercise,
      exerciseId: random?.id ?? "ex_001",
      ...nextMockStep(exercise.topicId),
    });
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
