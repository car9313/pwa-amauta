// src/hooks/useExercise.ts
// ============================================================
// Hooks de TanStack Query para ejercicios
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNextExercise, submitAnswer } from '@/services/exercise.service'
import type { SubmitAnswerPayload, Exercise, ExerciseResult } from '@/types/exercise.types'

export const exerciseKeys = {
  all: ['exercises'] as const,
  next: (studentId: string) => ['exercises', 'next', studentId] as const,
}

export function useNextExercise(studentId: string) {
  return useQuery<Exercise, Error>({
    queryKey: exerciseKeys.next(studentId),
    queryFn: () => getNextExercise(studentId),
    staleTime: Number(import.meta.env.VITE_QUERY_STALE_TIME ?? 60) * 1000,
    retry: (failureCount, error: any) => {
      if (error?.statusCode === 404) return false
      return failureCount < 2
    },
  })
}

export function useSubmitAnswer(studentId: string) {
  const queryClient = useQueryClient()

  return useMutation<ExerciseResult, Error, SubmitAnswerPayload>({
    mutationFn: (payload) => submitAnswer(studentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: exerciseKeys.next(studentId),
      })
    },
  })
}