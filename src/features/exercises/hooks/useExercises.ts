import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllExercises,
  getExerciseById,
  getExercisesByType,
  getExercisesByDifficulty,
  saveExercise,
  saveExercises,
  deleteExercise,
  clearExercises,
  getExercisesCount,
} from "@/lib/api/storage/exercises-db";
import { exerciseKeys } from "@/lib/query/keys";
import type { Exercise as DbExercise } from "@/lib/api/storage/db";

export function useExercises() {
  return useQuery<DbExercise[], Error>({
    queryKey: exerciseKeys.all,
    queryFn: getAllExercises,
  });
}

export function useExercise(id: string) {
  return useQuery<DbExercise | undefined, Error>({
    queryKey: exerciseKeys.detail(id),
    queryFn: () => getExerciseById(id),
    enabled: !!id,
  });
}

export function useExercisesByType(type: string) {
  return useQuery<DbExercise[], Error>({
    queryKey: exerciseKeys.byType(type),
    queryFn: () => getExercisesByType(type as DbExercise["type"]),
    enabled: !!type,
  });
}

export function useExercisesByDifficulty(difficulty: number) {
  return useQuery<DbExercise[], Error>({
    queryKey: exerciseKeys.byDifficulty(difficulty),
    queryFn: () => getExercisesByDifficulty(difficulty),
    enabled: difficulty > 0,
  });
}

export function useExercisesCount() {
  return useQuery<number, Error>({
    queryKey: exerciseKeys.count(),
    queryFn: getExercisesCount,
  });
}

export function useSaveExercise() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DbExercise>({
    mutationFn: saveExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
    },
  });
}

export function useSaveExercises() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DbExercise[]>({
    mutationFn: saveExercises,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
    },
  });
}

export function useClearExercises() {
  const queryClient = useQueryClient();

  return useMutation<void, Error>({
    mutationFn: clearExercises,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
    },
  });
}