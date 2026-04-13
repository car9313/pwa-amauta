// src/hooks/useStudent.ts
// ============================================================
// Hooks de TanStack Query para estudiantes
// ============================================================

import { useQuery } from '@tanstack/react-query'
import { getStudentDashboard } from '@/services/exercise.service'
import type { StudentDashboard } from '@/types/exercise.types'

export const studentKeys = {
  all: ['student'] as const,
  dashboard: (studentId: string) => ['student', 'dashboard', studentId] as const,
}

export function useStudentDashboard(studentId: string) {
  return useQuery<StudentDashboard, Error>({
    queryKey: studentKeys.dashboard(studentId),
    queryFn: () => getStudentDashboard(studentId),
    staleTime: Number(import.meta.env.VITE_QUERY_STALE_TIME ?? 60) * 1000,
    retry: (failureCount, error: any) => {
      if (error?.statusCode === 404) return false
      return failureCount < 2
    },
  })
}