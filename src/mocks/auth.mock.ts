// src/mocks/auth.mock.ts
// ============================================================
// Mocks para autenticación y usuarios
// ============================================================

import type { RegisterData, AuthSession, AuthUser, ParentDashboard, StudentProgress } from '@/types/auth.types'

function delay<T>(data: T, ms = 600): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), ms))
}

// ============================================================
// Auth Mocks
// ============================================================

export const mockAuthUser: AuthUser = {
  id: 'usr_001',
  name: 'Mario',
  email: 'mario@ejemplo.com',
  role: 'student',
}

export const mockParentUser: AuthUser = {
  id: 'usr_parent_001',
  name: 'Ana María',
  email: 'ana@ejemplo.com',
  role: 'parent',
}

export const mockLoginSuccess: AuthSession = {
  token: 'mock_token_student_123',
  user: mockAuthUser,
}

export const mockLoginParentSuccess: AuthSession = {
  token: 'mock_token_parent_456',
  user: mockParentUser,
}

export const mockRegisterSuccess: AuthSession = {
  token: 'mock_token_new_789',
  user: {
    id: 'usr_new_001',
    name: '',
    email: '',
    role: null,
  },
}

export async function loginMock(email: string, _password: string): Promise<AuthSession> {
  // Simular autenticación
  console.log(email.includes('parent'))
  if (email.includes('parent')) {
    return delay(mockLoginParentSuccess)
  }
  return delay(mockLoginSuccess)
}

export async function registerMock(data: RegisterData): Promise<AuthSession> {
  return delay({
    ...mockRegisterSuccess,
    user: {
      ...mockRegisterSuccess.user,
      name: data.name,
      email: data.email,
      role: data.role,
    },
  })
}

// ============================================================
// Parent Dashboard Mocks
// ============================================================

export const mockParentDashboard: ParentDashboard = {
  parent: {
    parentId: 'par_001',
    name: 'Ana María',
    email: 'ana@ejemplo.com',
    children: [
      {
        childId: 'ch_001',
        name: 'Mario',
        avatar: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop',
        level: 2,
        points: 156,
        precision: 85,
        streakDays: 4,
      },
      {
        childId: 'ch_002',
        name: 'Lucía',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
        level: 3,
        points: 234,
        precision: 92,
        streakDays: 7,
      },
    ],
  },
  childrenOverview: [
    {
      childId: 'ch_001',
      name: 'Mario',
      level: 2,
      points: 156,
      precision: 85,
      streakDays: 4,
    },
    {
      childId: 'ch_002',
      name: 'Lucía',
      level: 3,
      points: 234,
      precision: 92,
      streakDays: 7,
    },
  ],
  recentActivity: [
    {
      id: 'act_001',
      childId: 'ch_001',
      childName: 'Mario',
      action: 'Completó lección',
      subject: 'Matemáticas - Fracciones',
      timestamp: 'Hace 30 minutos',
    },
    {
      id: 'act_002',
      childId: 'ch_002',
      childName: 'Lucía',
      action: 'Alcanzó nivel 3',
      subject: 'Álgebra básica',
      timestamp: 'Hace 2 horas',
    },
    {
      id: 'act_003',
      childId: 'ch_001',
      childName: 'Mario',
      action: 'Nueva racha: 4 días',
      subject: 'Práctica diaria',
      timestamp: 'Ayer',
    },
    {
      id: 'act_004',
      childId: 'ch_002',
      childName: 'Luc��a',
      action: 'Completó quiz',
      subject: 'Ciencias - Ecosistemas',
      timestamp: 'Ayer',
    },
  ],
}

export async function getParentDashboardMock(_parentId: string): Promise<ParentDashboard> {
  return delay(mockParentDashboard)
}

// ============================================================
// Student Progress Mocks
// ============================================================

export const mockStudentProgress: StudentProgress = {
  studentId: 'stu_001',
  studentName: 'Mario',
  overallProgress: 72,
  subjects: [
    { subjectId: 'math', subjectName: 'Matemáticas', mastery: 0.75, lastPractice: 'Hoy' },
    { subjectId: 'spanish', subjectName: 'Español', mastery: 0.85, lastPractice: 'Ayer' },
    { subjectId: 'science', subjectName: 'Ciencias', mastery: 0.60, lastPractice: 'Hace 2 días' },
    { subjectId: 'social', subjectName: 'Ciencias Sociales', mastery: 0.90, lastPractice: 'Hace 3 días' },
  ],
  achievements: [
    { id: 'ach_001', title: 'Primera Racha', description: '4 días seguidos', earnedAt: '2026-02-20' },
    { id: 'ach_002', title: 'Nivel 2', description: 'Alcanzó nivel 2', earnedAt: '2026-02-18' },
    { id: 'ach_003', title: '100% Precisión', description: 'En quiz de fracciones', earnedAt: '2026-02-15' },
    { id: 'ach_004', title: 'Matemáticas', description: 'Dominó fracciones', earnedAt: '2026-02-10' },
  ],
  weakAreas: [
    { topicId: 'frac_mult', topicName: 'Multiplicación de fracciones', recommendation: 'Practica con problemas visuales' },
    { topicId: 'frac_div', topicName: 'División de fracciones', recommendation: 'Repasa la tabla de multiplicar' },
  ],
}

export async function getStudentProgressMock(_studentId: string): Promise<StudentProgress> {
  return delay(mockStudentProgress)
}