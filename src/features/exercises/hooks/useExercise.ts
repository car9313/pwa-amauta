import { useQuery } from "@tanstack/react-query";
import { getNextExercise, submitAnswer } from "@/services/exercise.service";
import type { SubmitAnswerPayload, Exercise, ExerciseResult } from "@/features/exercises/domain/exercise.types";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";
import { exerciseKeys } from "@/lib/query/keys";
import { useSafeMutation } from "@/lib/sync/useSafeMutation";

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
  const tenantId = useAuthStore((state) => state.user?.tenantId ?? null);

  return useSafeMutation<ExerciseResult, SubmitAnswerPayload>({
    mutationFn: (payload) => submitAnswer(studentId, payload),
    queryKey: exerciseKeys.next(studentId, tenantId),
    tentativeOnly: true,
    optimisticUpdate: (oldExercise) => {
      if (typeof oldExercise !== "object" || oldExercise === null) return oldExercise;
      return { ...(oldExercise as object), _submitted: true, _submittedAt: Date.now() };
    },
    offline: {
      type: "submitAnswer",
      endpoint: (payload) => `/students/${studentId}/exercises/${payload.exerciseId}/submit`,
      method: "POST",
    },
  });
}
