import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProgressByStudent,
  getProgressByStudentAndLesson,
  saveProgress,
  updateProgress as updateProgressDb,
  deleteProgress,
  clearProgress,
  getProgressCount,
} from "@/lib/api/storage/progress-db";
import { progressKeys } from "@/lib/query/keys";
import type { StudentProgress } from "@/lib/api/storage/db";

export function useProgressByStudent(studentId: string) {
  return useQuery<StudentProgress[], Error>({
    queryKey: progressKeys.student(studentId),
    queryFn: () => getProgressByStudent(studentId),
    enabled: !!studentId,
  });
}

export function useProgressByStudentAndLesson(studentId: string, lessonId: string) {
  return useQuery<StudentProgress | undefined, Error>({
    queryKey: progressKeys.byLesson(studentId, lessonId),
    queryFn: () => getProgressByStudentAndLesson(studentId, lessonId),
    enabled: !!studentId && !!lessonId,
  });
}

export function useProgressCount() {
  return useQuery<number, Error>({
    queryKey: progressKeys.count(),
    queryFn: getProgressCount,
  });
}

export function useSaveProgress() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, StudentProgress>({
    mutationFn: saveProgress,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: progressKeys.student(variables.studentId) });
    },
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { studentId: string; lessonId: string; updates: Partial<StudentProgress> }>({
    mutationFn: ({ studentId, lessonId, updates }) =>
      updateProgressDb(studentId, lessonId, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: progressKeys.student(variables.studentId) });
      queryClient.invalidateQueries({
        queryKey: progressKeys.byLesson(variables.studentId, variables.lessonId),
      });
    },
  });
}

export function useDeleteProgress() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { studentId: string; lessonId: string }>({
    mutationFn: ({ studentId, lessonId }) => deleteProgress(studentId, lessonId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: progressKeys.student(variables.studentId) });
    },
  });
}

export function useClearProgress() {
  const queryClient = useQueryClient();

  return useMutation<void, Error>({
    mutationFn: clearProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressKeys.all });
    },
  });
}