import { useState, useEffect } from "react";
import { retryFailedMutations } from "@/lib/sync/queue-manager";
import { getFailedCount, clearAllMutations } from "@/lib/api/storage/offline-queue";
import { onSyncEvent } from "@/lib/sync/background-sync";

export function useFailedMutationCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void getFailedCount().then(setCount);

    const unsub = onSyncEvent(() => {
      void getFailedCount().then(setCount);
    });

    return unsub;
  }, []);

  const retry = async () => {
    setLoading(true);
    try {
      await retryFailedMutations();
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  const dismiss = async () => {
    await clearAllMutations();
    setCount(0);
  };

  return { count, loading, retry, dismiss };
}
