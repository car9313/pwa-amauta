// src/mocks/exercise.mock.ts
// ============================================================
// Datos mock para ejercicios - Desarrollo offline
// ============================================================

import type { Exercise, ExerciseResult, StudentDashboard, Student } from '@/types/exercise.types'

export const mockExercise: Exercise = {
  exerciseId: 'ex_mock_001',
  topicId: 'ADD_W_CARRY',
  objectiveId: 'OBJ_G2_ADD_2DIGIT_CARRY',
  subject: 'MATH',
  title: 'División con fracciones',
  question: '¿Cuánto es ³/₄ ÷ ⁷/₅?',
  hint: 'La división de fracciones es como multiplicar en cruz.',
  difficulty: 3,
  stepCurrent: 1,
  stepTotal: 3,
  pedagogy: 'Visual',
  intent: 'REMEDIATE',
  masteryBand: 'LOW',
}

export const mockExerciseResult: ExerciseResult = {
  isCorrect: false,
  mistakes: ['CARRY_MISSED', 'COLUMN_MISALIGN'],
  feedback: {
    title: 'Lo que se te olvidó',
    items: [
      'Multiplicar en cruz.',
      'Simplificar el resultado.',
    ],
  },
  masteryUpdated: 0.45,
  pointsEarned: 0,
  nextIntent: 'REMEDIATE',
}

function delay<T>(data: T, ms = 600): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), ms))
}

export async function getExerciseMock(): Promise<Exercise> {
  return delay(mockExercise)
}

export async function submitAnswerMock(
  _exerciseId: string,
  _answer: string
): Promise<ExerciseResult> {
  return delay(mockExerciseResult)
}

// ============================================================
// Mock: Dashboard del estudiante
// ============================================================

const mockStudent: Student = {
  studentId: 'stu_445',
  name: 'Mario',
  level: 2,
  points: 156,
  precision: 85,
  streakDays: 4,
  streakWeek: [true, true, true, true, false, false, false],
}

export const mockDashboard: StudentDashboard = {
  student: mockStudent,
  agenda: [
    {
      lessonId: 'les_001',
      title: 'División con fracciones',
      subject: 'Matemáticas',
      scheduledAt: '10:00 AM',
      durationMinutes: 30,
      completed: false,
    },
    {
      lessonId: 'les_002',
      title: 'Multiplicación de fracciones',
      subject: 'Matemáticas',
      scheduledAt: '11:00 AM',
      durationMinutes: 25,
      completed: true,
    },
    {
      lessonId: 'les_003',
      title: 'Quiz de fracciones',
      subject: 'Matemáticas',
      scheduledAt: '2:00 PM',
      durationMinutes: 15,
      completed: false,
    },
  ],
  progress: [
    { topicId: 'DIV_FRACCIONES', title: 'División con fracciones', mastery: 0.75 },
    { topicId: 'MUL_FRACCIONES', title: 'Multiplicación con fracciones', mastery: 1.0 },
    { topicId: 'SUM_FRACCIONES', title: 'Suma de fracciones', mastery: 0.5 },
  ],
  recentAchievements: [
    { id: 'ach_001', title: 'Primera Racha', description: '4 días seguidos', type: 'streak' },
    { id: 'ach_002', title: 'Nivel 2', description: 'Alcanzado', type: 'level' },
    { id: 'ach_003', title: '100% Precisión', description: 'En quiz', type: 'accuracy' },
  ],
}

export async function getDashboardMock(_studentId: string): Promise<StudentDashboard> {
  return delay(mockDashboard)
}