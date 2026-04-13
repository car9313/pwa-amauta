// src/types/exercise.types.ts
// ============================================================
// Tipos para el sistema de ejercicios adaptativos de Amauta
// Basado en el contexto del proyecto
// ============================================================

export interface Exercise {
  exerciseId: string
  topicId: string
  objectiveId: string
  subject: string
  title: string
  question: string
  hint?: string
  difficulty: number
  stepCurrent: number
  stepTotal: number
  pedagogy: 'Visual' | 'Text' | 'Interactive'
  intent: 'REMEDIATE' | 'PRACTICE' | 'ADVANCE'
  masteryBand: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface ExerciseResult {
  isCorrect: boolean
  mistakes?: string[]
  feedback: {
    title: string
    items: string[]
  }
  masteryUpdated: number
  pointsEarned: number
  nextIntent: string
}

export interface SubmitAnswerPayload {
  exerciseId: string
  answer: string
}

export interface Student {
  studentId: string
  name: string
  avatar?: string
  level: number
  points: number
  precision: number
  streakDays: number
  streakWeek: boolean[]
}

export interface AgendaItem {
  lessonId: string
  title: string
  subject: string
  scheduledAt: string
  durationMinutes: number
  completed: boolean
  onStart?: () => void
}

export interface ProgressItem {
  topicId: string
  title: string
  mastery: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  type: 'streak' | 'level' | 'accuracy'
}

export interface StudentDashboard {
  student: Student
  agenda: AgendaItem[]
  progress: ProgressItem[]
  recentAchievements: Achievement[]
}