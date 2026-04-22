import { useCallback, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queueMutation, triggerSync, getQueueState } from "./queue-manager";
import { getPendingMutationsCount } from "@/lib/api/storage/offline-queue";
import type { MutationType } from "@/lib/api/storage/offline-queue";
import { authKeys } from "@/lib/query/keys";

type MutationMethod = "POST" | "PUT" | "PATCH" | "DELETE";

interface UseOfflineMutationOptions {
  type: MutationType;
  endpoint: string;
  method?: MutationMethod;
  onQueued?: (mutationId: string) => void;
}

interface UseOfflineMutationResult {
  mutate: (payload: unknown) => void;
  mutateAsync: (payload: unknown) => Promise<{ online: boolean; queued: boolean; mutationId?: string }>;
  isPending: boolean;
  isOnline: boolean;
  isQueued: boolean;
  pendingCount: number;
  error: Error | null;
  retry: () => Promise<void>;
}

export function useOfflineMutation({
  type,
  endpoint,
  method = "POST",
  onQueued,
}: UseOfflineMutationOptions): UseOfflineMutationResult {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isQueued, setIsQueued] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    getPendingMutationsCount().then(setPendingCount);

    const interval = setInterval(async () => {
      const count = await getPendingMutationsCount();
      setPendingCount(count);
    }, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  const mutation = useMutation({
    mutationFn: async (payload: unknown) => {
      setError(null);

      const result = await queueMutation(type, payload, endpoint, method);

      if (!result.online && result.queued) {
        setIsQueued(true);
        onQueued?.(result.mutationId!);
        return result;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (err) => {
      setError(err);
    },
  });

  const mutate = useCallback(
    (payload: unknown) => {
      mutation.mutate(payload);
    },
    [mutation]
  );

  const mutateAsync = useCallback(
    async (payload: unknown) => {
      return mutation.mutateAsync(payload);
    },
    [mutation]
  );

  const retry = useCallback(async () => {
    setIsQueued(false);
    setError(null);
    await triggerSync();
  }, []);

  return {
    mutate,
    mutateAsync,
    isPending: mutation.isPending,
    isOnline,
    isQueued,
    pendingCount,
    error,
    retry,
  };
}

export function usePendingMutations() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const updateCount = async () => {
      const count = await getPendingMutationsCount();
      setPendingCount(count);

      const state = await getQueueState();
      setIsSyncing(state.isSyncing);
    };

    updateCount();

    const interval = setInterval(updateCount, 3000);

    return () => clearInterval(interval);
  }, []);

  return { pendingCount, isSyncing };
}