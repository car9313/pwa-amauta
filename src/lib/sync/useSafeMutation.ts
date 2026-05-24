import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queueMutation } from "./queue-manager";
import type { MutationType } from "@/lib/api/storage/offline-queue";

export const QUEUED_OFFLINE = Symbol("queued-offline");

export interface OfflineConfig<TPayload> {
  type: MutationType;
  endpoint: string | ((payload: TPayload) => string);
  method: "POST" | "PUT" | "PATCH" | "DELETE";
}

export interface UseSafeMutationOptions<TData, TPayload> {
  mutationFn: (payload: TPayload) => Promise<TData>;
  queryKey: readonly unknown[] | ((payload: TPayload) => readonly unknown[]);
  optimisticUpdate?: (oldData: unknown, payload: TPayload) => unknown;
  offline?: OfflineConfig<TPayload>;
  tentativeOnly?: boolean;
}

interface MutationContext {
  previousData: unknown;
  key: readonly unknown[];
}

function resolveQueryKey<TPayload>(
  keyOrFn: readonly unknown[] | ((payload: TPayload) => readonly unknown[]),
  payload: TPayload,
): readonly unknown[] {
  return typeof keyOrFn === "function" ? keyOrFn(payload) : keyOrFn;
}

export function useSafeMutation<TData, TPayload>({
  mutationFn,
  queryKey: queryKeyOrFn,
  optimisticUpdate,
  offline,
  tentativeOnly,
}: UseSafeMutationOptions<TData, TPayload>) {
  const queryClient = useQueryClient();

  return useMutation<TData | typeof QUEUED_OFFLINE, Error, TPayload, MutationContext>({
    mutationFn: async (payload) => {
      if (!navigator.onLine && offline) {
        const endpoint =
          typeof offline.endpoint === "function"
            ? offline.endpoint(payload)
            : offline.endpoint;
        await queueMutation(offline.type, payload, endpoint, offline.method);
        return QUEUED_OFFLINE;
      }
      return mutationFn(payload);
    },

    onMutate: async (payload) => {
      const key = resolveQueryKey(queryKeyOrFn, payload);

      if (!optimisticUpdate) {
        return { previousData: undefined, key };
      }

      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData(key);

      if (tentativeOnly) {
        queryClient.setQueryData(key, (old: unknown) => {
          if (typeof old !== "object" || old === null) return old;
          return { ...(old as object), _submitted: true, _submittedAt: Date.now() };
        });
      } else {
        queryClient.setQueryData(key, (old: unknown) =>
          optimisticUpdate(old, payload)
        );
      }

      return { previousData, key };
    },

    onError: (_error, payload, context) => {
      if (!context?.previousData) return;
      const key = context.key ?? resolveQueryKey(queryKeyOrFn, payload);
      queryClient.setQueryData(key, context.previousData);
    },

    onSettled: (data, error, payload) => {
      if (data === QUEUED_OFFLINE) return;
      if (error) return;
      if (!tentativeOnly) {
        const key = resolveQueryKey(queryKeyOrFn, payload);
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
