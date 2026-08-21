import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMasteryByStudent,
  getMasteryByStudentAndTopic,
  recordConceptAttempt,
  type ConceptAttemptInput,
} from "@/lib/api/storage/concept-mastery-db";
import type { ConceptMasteryEntry } from "@/lib/api/storage/db";
import { progressKeys } from "@/lib/query/keys";

export function useConceptMastery(studentId: string) {
  return useQuery<ConceptMasteryEntry[], Error>({
    queryKey: progressKeys.mastery(studentId),
    queryFn: () => getMasteryByStudent(studentId),
    enabled: !!studentId,
  });
}

export function useConceptMasteryForTopic(studentId: string, topicId?: string | null) {
  return useQuery<ConceptMasteryEntry | undefined, Error>({
    queryKey: progressKeys.masteryTopic(studentId, topicId ?? ""),
    queryFn: () => getMasteryByStudentAndTopic(studentId, topicId as string),
    enabled: !!studentId && !!topicId,
  });
}

export type RecordConceptAttemptPayload = ConceptAttemptInput;

export function useRecordConceptAttempt() {
  const queryClient = useQueryClient();

  return useMutation<ConceptMasteryEntry, Error, RecordConceptAttemptPayload>({
    mutationFn: recordConceptAttempt,
    onSuccess: (entry) => {
      void queryClient.invalidateQueries({
        queryKey: progressKeys.mastery(entry.studentId),
      });
    },
  });
}
