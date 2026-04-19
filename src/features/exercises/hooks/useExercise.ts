import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNextExercise, submitAnswer } from "@/services/exercise.service";
import type { SubmitAnswerPayload, Exercise, ExerciseResult } from "@/features/exercises/domain/exercise.types";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";
import { exerciseKeys } from "@/lib/query/keys";

export function useNextExercise(studentId: string) {
  const tenantId = useAuthStore((state) => state.user?.tenantId ?? null);

  return useQuery<Exercise, Error>({
    queryKey: exerciseKeys.next(studentId, tenantId),
    queryFn: () => getNextExercise(studentId),
    staleTime: Number(import.meta.env.VITE_QUERY_STALE_TIME ?? 60) * 1000,
    retry: 2,
  });
}

export function useSubmitAnswer(studentId: string) {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.user?.tenantId ?? null);

  return useMutation<ExerciseResult, Error, SubmitAnswerPayload>({
    mutationFn: (payload) => submitAnswer(studentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: exerciseKeys.next(studentId, tenantId),
      });
    },
  });
}
