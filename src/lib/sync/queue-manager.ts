import { httpClient } from "@/lib/http/client";
import { shouldRetry, getRetryDelay } from "./retry";
import type { QueuedMutation } from "@/lib/api/storage/db";
import {
  enqueueMutation,
  getQueuedMutationsByPriority,
  updateMutationStatus,
  incrementRetryCount,
  removeMutation,
  getPendingCount,
} from "@/lib/api/storage/offline-queue";

let isSyncing = false;
let syncListeners: Array<(count: number) => void> = [];

export function isOnline(): boolean {
  return navigator.onLine;
}

export function onSyncChange(listener: (count: number) => void): () => void {
  syncListeners.push(listener);
  return () => {
    syncListeners = syncListeners.filter((l) => l !== listener);
  };
}

function notifySyncListeners(count: number): void {
  syncListeners.forEach((listener) => listener(count));
}

async function executeMutation(
  mutation: QueuedMutation
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    await updateMutationStatus(mutation.id, "syncing");

    let response: unknown;

    if (
      mutation.method === "POST" ||
      mutation.method === "PUT" ||
      mutation.method === "PATCH"
    ) {
      response = await httpClient.request(mutation.endpoint, {
        method: mutation.method,
        body: JSON.stringify(mutation.payload),
      });
    } else if (mutation.method === "DELETE") {
      response = await httpClient.request(mutation.endpoint, {
        method: mutation.method,
      });
    }

    return { success: true, data: response };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

export async function processQueue(
  options: {
    maxPerBatch?: number;
  } = {}
): Promise<{
  processed: number;
  successful: number;
  failed: number;
  conflicts: number;
}> {
  const { maxPerBatch = 10 } = options;

  if (isSyncing) {
    return { processed: 0, successful: 0, failed: 0, conflicts: 0 };
  }

  if (!isOnline()) {
    return { processed: 0, successful: 0, failed: 0, conflicts: 0 };
  }

  isSyncing = true;

  try {
    const mutations = await getQueuedMutationsByPriority();
    const pendingMutations = mutations.slice(0, maxPerBatch);

    let processed = 0;
    let successful = 0;
    let failed = 0;
    let conflicts = 0;

    for (const mutation of pendingMutations) {
      if (!isOnline()) {
        break;
      }

      const result = await executeMutation(mutation);

      if (result.success) {
        await updateMutationStatus(mutation.id, "done", null, result.data);
        await removeMutation(mutation.id);
        successful++;
      } else {
        await incrementRetryCount(mutation.id);

        const updated = await (
          await import("@/lib/api/storage/offline-queue")
        ).getMutationById(mutation.id);

        if (updated && shouldRetry(updated.retryCount)) {
          await updateMutationStatus(mutation.id, "pending", result.error ?? null);
          await new Promise((resolve) =>
            setTimeout(resolve, getRetryDelay(updated.retryCount))
          );
        } else {
          await updateMutationStatus(mutation.id, "failed", result.error ?? null);
          failed++;
        }
      }

      processed++;
    }

    const pendingCount = await getPendingCount();
    notifySyncListeners(pendingCount);

    return { processed, successful, failed, conflicts };
  } finally {
    isSyncing = false;
  }
}

export async function queueMutation<
  T extends
    | "login"
    | "register"
    | "logout"
    | "addChild"
    | "updateProgress"
    | "updateProfile"
    | "updatePreferences"
>(
  type: T,
  payload: unknown,
  endpoint: string,
  method?: "POST" | "PUT" | "PATCH" | "DELETE"
): Promise<{ online: boolean; queued: boolean; mutationId?: string }> {
  const online = isOnline();

  if (online) {
    return { online: true, queued: false };
  }

  const mutationId = await enqueueMutation(type, payload, endpoint, method);

  const pendingCount = await getPendingCount();
  notifySyncListeners(pendingCount);

  return { online: false, queued: true, mutationId };
}

export async function getPendingMutationsCount(): Promise<number> {
  return getPendingCount();
}

export function isQueueSyncing(): boolean {
  return isSyncing;
}

export async function retryFailedMutations(): Promise<void> {
  const mutations = await (
    await import("@/lib/api/storage/offline-queue")
  ).getQueuedMutations();

  const failed = mutations.filter((m) => m.status === "failed");

  for (const mutation of failed) {
    await updateMutationStatus(mutation.id, "pending");
    await (
      await import("@/lib/api/storage/offline-queue")
    ).incrementRetryCount(mutation.id);
  }

  const pendingCount = await getPendingCount();
  notifySyncListeners(pendingCount);
}

export async function clearQueue(): Promise<void> {
  const { clearAllMutations } = await import("@/lib/api/storage/offline-queue");
  await clearAllMutations();
  notifySyncListeners(0);
}

export interface QueueState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
}

export async function getQueueState(): Promise<QueueState> {
  return {
    isOnline: isOnline(),
    isSyncing,
    pendingCount: await getPendingCount(),
  };
}

export async function triggerSync(): Promise<void> {
  const state = await getQueueState();
  if (state.isOnline && state.pendingCount > 0 && !state.isSyncing) {
    await processQueue();
  }
}