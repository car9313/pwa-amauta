import { useQuery } from '@tanstack/react-query'
import { getStudentDashboard } from '@/services/exercise.service'
import { studentKeys } from '@/lib/query/keys'
import type { StudentDashboard } from '@/features/exercises/domain/exercise.types'

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
