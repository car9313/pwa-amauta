// src/services/auth.service.ts
// ============================================================
// Servicio de autenticación con soporte para mocks
// ============================================================

import type { AuthSession, RegisterData, LoginCredentials, ParentDashboard, StudentProgress } from '@/types/auth.types'
import { loginMock, registerMock, getParentDashboardMock, getStudentProgressMock } from '@/mocks/auth.mock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const BASE_URL = import.meta.env.VITE_API_BASE_URL
const VERSION = import.meta.env.VITE_API_VERSION ?? 'v1'
const API_URL = `${BASE_URL}/${VERSION}`

function getToken(): string | null {
  return localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY ?? 'amauta_token')
}

function setToken(token: string): void {
  localStorage.setItem(import.meta.env.VITE_AUTH_TOKEN_KEY ?? 'amauta_token', token)
}

function clearToken(): void {
  localStorage.removeItem(import.meta.env.VITE_AUTH_TOKEN_KEY ?? 'amauta_token')
}

// ============================================================
// Auth
// ============================================================

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
 console.log(credentials)
 console.log(USE_MOCK)
  if (USE_MOCK || !BASE_URL) {
    const prueba=loginMock(credentials.email, credentials.password)
    return prueba
  }

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  if (!res.ok) {
    const error = await res.json()
    throw error
  }

  const session = await res.json()
  setToken(session.token)
  return session
}

export async function register(data: RegisterData): Promise<AuthSession> {
  if (USE_MOCK || !BASE_URL) {
    return registerMock(data)
  }

  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    throw error
  }

  const session = await res.json()
  setToken(session.token)
  return session
}

export function logout(): void {
  clearToken()
}

// ============================================================
// Parent Dashboard
// ============================================================

export async function getParentDashboard(parentId: string): Promise<ParentDashboard> {
  if (USE_MOCK || !BASE_URL) {
    return getParentDashboardMock(parentId)
  }

  const res = await fetch(`${API_URL}/parents/${parentId}/dashboard`, {
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

// ============================================================
// Student Progress
// ============================================================

export async function getStudentProgress(studentId: string): Promise<StudentProgress> {
  if (USE_MOCK || !BASE_URL) {
    return getStudentProgressMock(studentId)
  }

  const res = await fetch(`${API_URL}/students/${studentId}/progress`, {
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