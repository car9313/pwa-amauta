import { processQueue, getQueueState, getPendingMutationsCount, triggerSync as doTriggerSync } from "./queue-manager";

let syncInterval: ReturnType<typeof setInterval> | null = null;
let isRunning = false;
let listeners: Array<(event: SyncEvent) => void> = [];

export type SyncEventType =
  | "sync:started"
  | "sync:completed"
  | "sync:failed"
  | "sync:online"
  | "sync:offline";

export interface SyncEvent {
  type: SyncEventType;
  timestamp: number;
  data?: {
    processed?: number;
    successful?: number;
    failed?: number;
    conflicts?: number;
    error?: string;
  };
}

function emit(event: SyncEvent): void {
  listeners.forEach((listener) => listener(event));
}

async function handleOnline(): Promise<void> {
  emit({
    type: "sync:online",
    timestamp: Date.now(),
  });

  const queueState = await getQueueState();
  if (queueState.pendingCount > 0) {
    await doTriggerSync();
  }
}

function handleOffline(): void {
  emit({
    type: "sync:offline",
    timestamp: Date.now(),
  });
}

export async function triggerSyncEvent(): Promise<SyncEvent | null> {
  const queueState = await getQueueState();

  if (!queueState.isOnline || queueState.isSyncing || queueState.pendingCount === 0) {
    return null;
  }

  emit({
    type: "sync:started",
    timestamp: Date.now(),
  });

  try {
    const result = await processQueue();

    emit({
      type: "sync:completed",
      timestamp: Date.now(),
      data: {
        processed: result.processed,
        successful: result.successful,
        failed: result.failed,
        conflicts: result.conflicts,
      },
    });

    return {
      type: "sync:completed",
      timestamp: Date.now(),
      data: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    emit({
      type: "sync:failed",
      timestamp: Date.now(),
      data: {
        error: errorMessage,
      },
    });

    return {
      type: "sync:failed",
      timestamp: Date.now(),
      data: {
        error: errorMessage,
      },
    };
  }
}

export function startBackgroundSync(options: { intervalMs?: number; autoSync?: boolean } = {}): {
  intervalMs: number;
  autoSync: boolean;
} {
  const { intervalMs = 30000, autoSync = true } = options;

  if (isRunning) {
    return { intervalMs, autoSync };
  }

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  if (autoSync) {
    syncInterval = setInterval(async () => {
      const queueState = await getQueueState();
      if (queueState.isOnline && queueState.pendingCount > 0) {
        await triggerSyncEvent();
      }
    }, intervalMs);
  }

  isRunning = true;

  return { intervalMs, autoSync };
}

export function stopBackgroundSync(): void {
  window.removeEventListener("online", handleOnline);
  window.removeEventListener("offline", handleOffline);

  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }

  isRunning = false;
}

export function onSyncEvent(listener: (event: SyncEvent) => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export async function initBackgroundSync(options?: {
  intervalMs?: number;
  autoSync?: boolean;
}): Promise<void> {
  const pendingCount = await getPendingMutationsCount();

  if (pendingCount > 0 && navigator.onLine) {
    await doTriggerSync();
  }

  startBackgroundSync(options);
}

export function getSyncStatus(): {
  isRunning: boolean;
  hasInterval: boolean;
} {
  return {
    isRunning,
    hasInterval: syncInterval !== null,
  };
}

export { onSyncChange } from "./queue-manager";
export type { QueueState } from "./queue-manager";