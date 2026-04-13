// src/types/auth.types.ts
// ============================================================
// Tipos para autenticación y registro
// ============================================================

export interface RegisterData {
  name: string
  email: string
  password: string
  role: "student" | "parent"
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: "student" | "parent" | null
}

export interface AuthSession {
  token: string
  user: AuthUser
}

export interface AuthState {
  isAuthenticated: boolean
  user: AuthUser | null
  role: "student" | "parent" | null
}

export interface ParentProfile {
  parentId: string
  name: string
  email: string
  children: ChildProfile[]
}

export interface ChildProfile {
  childId: string
  name: string
  avatar?: string
  level: number
  points: number
  precision: number
  streakDays: number
}

export interface ParentDashboard {
  parent: ParentProfile
  childrenOverview: ChildProfile[]
  recentActivity: ActivityItem[]
}

export interface ActivityItem {
  id: string
  childId: string
  childName: string
  action: string
  subject: string
  timestamp: string
}

export interface StudentProgress {
  studentId: string
  studentName: string
  overallProgress: number
  subjects: SubjectProgress[]
  achievements: ProgressAchievement[]
  weakAreas: WeakArea[]
}

export interface SubjectProgress {
  subjectId: string
  subjectName: string
  mastery: number
  lastPractice: string
}

export interface ProgressAchievement {
  id: string
  title: string
  description: string
  earnedAt: string
}

export interface WeakArea {
  topicId: string
  topicName: string
  recommendation: string
}