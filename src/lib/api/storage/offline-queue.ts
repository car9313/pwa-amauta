import { db, type QueuedMutation } from "./db";

export type MutationType =
  | "login"
  | "register"
  | "logout"
  | "addChild"
  | "updateProgress"
  | "updateProfile"
  | "updatePreferences";

export type MutationStatus = "pending" | "syncing" | "done" | "failed";

export type MutationPriority = 1 | 2 | 3;

export const MUTATION_PRIORITY: Record<MutationType, MutationPriority> = {
  login: 1,
  logout: 1,
  register: 1,
  addChild: 2,
  updateProgress: 2,
  updateProfile: 3,
  updatePreferences: 3,
};

export function generateMutationId(): string {
  return `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function enqueueMutation(
  type: MutationType,
  payload: unknown,
  endpoint: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE" = "POST"
): Promise<string> {
  const mutation: QueuedMutation = {
    id: generateMutationId(),
    type,
    payload,
    endpoint,
    method,
    priority: MUTATION_PRIORITY[type],
    retryCount: 0,
    status: "pending",
    createdAt: Date.now(),
    lastAttemptAt: null,
    errorMessage: null,
    result: null,
  };

  await db.mutations.put(mutation);
  return mutation.id;
}

export async function getQueuedMutations(): Promise<QueuedMutation[]> {
  return db.mutations
    .where("status")
    .anyOf(["pending", "failed"])
    .toArray();
}

export async function getQueuedMutationsByPriority(): Promise<QueuedMutation[]> {
  return db.mutations
    .where("status")
    .anyOf(["pending", "failed"])
    .and((m) => m.retryCount < 3)
    .sortBy("priority");
}

export async function updateMutationStatus(
  id: string,
  status: MutationStatus,
  errorMessage: string | null = null,
  result: unknown | null = null
): Promise<void> {
  const updates: Partial<QueuedMutation> = {
    status,
    lastAttemptAt: Date.now(),
    errorMessage,
    result,
  };

  if (status === "pending" || status === "syncing") {
    delete updates.result;
  }

  await db.mutations.update(id, updates);
}

export async function incrementRetryCount(id: string): Promise<void> {
  const mutation = await db.mutations.get(id);
  if (!mutation) return;

  await db.mutations.update(id, {
    retryCount: mutation.retryCount + 1,
    lastAttemptAt: Date.now(),
  });
}

export async function removeMutation(id: string): Promise<void> {
  await db.mutations.delete(id);
}

export async function clearCompletedMutations(): Promise<void> {
  await db.mutations.where("status").equals("done").delete();
}

export async function clearAllMutations(): Promise<void> {
  await db.mutations.clear();
}

export async function getMutationById(id: string): Promise<QueuedMutation | undefined> {
  return db.mutations.get(id);
}

export async function getPendingCount(): Promise<number> {
  return db.mutations
    .where("status")
    .anyOf(["pending", "failed"])
    .and((m) => m.retryCount < 3)
    .count();
}

export const getPendingMutationsCount = getPendingCount;
