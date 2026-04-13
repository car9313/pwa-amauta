// src/services/exercise.service.ts
// ============================================================
// Servicio de ejercicios con soporte para mocks
// ============================================================

import type { Exercise, ExerciseResult, SubmitAnswerPayload, StudentDashboard } from '@/types/exercise.types'
import { getExerciseMock, submitAnswerMock, getDashboardMock } from '@/mocks/exercise.mock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const BASE_URL = import.meta.env.VITE_API_BASE_URL
const VERSION = import.meta.env.VITE_API_VERSION ?? 'v1'
const API_URL = `${BASE_URL}/${VERSION}`

function getToken(): string | null {
  return localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY ?? 'amauta_token')
}

export async function getNextExercise(studentId: string): Promise<Exercise> {
  if (USE_MOCK || !BASE_URL) {
    return getExerciseMock()
  }

  const res = await fetch(`${API_URL}/students/${studentId}/next-exercise`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const error = await res.json()
    throw error
  }

  return res.json()
}

export async function submitAnswer(
  studentId: string,
  payload: SubmitAnswerPayload
): Promise<ExerciseResult> {
  if (USE_MOCK || !BASE_URL) {
    return submitAnswerMock(payload.exerciseId, payload.answer)
  }

  const res = await fetch(
    `${API_URL}/students/${studentId}/exercises/${payload.exerciseId}/submit`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answer: payload.answer }),
    }
  )

  if (!res.ok) {
    const error = await res.json()
    throw error
  }

  return res.json()
}

export async function getStudentDashboard(studentId: string): Promise<StudentDashboard> {
  if (USE_MOCK || !BASE_URL) {
    return getDashboardMock(studentId)
  }

  const res = await fetch(`${API_URL}/students/${studentId}/dashboard`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const error = await res.json()
    throw error
  }

  return res.json()
}