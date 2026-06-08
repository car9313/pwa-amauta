import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { processQueue, queueMutation } from "./queue-manager";

const mockHttpClient = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/lib/http/client", () => ({
  httpClient: mockHttpClient,
}));

const mockOfflineQueue = vi.hoisted(() => ({
  enqueueMutation: vi.fn(),
  getQueuedMutationsByPriority: vi.fn(),
  updateMutationStatus: vi.fn(),
  incrementRetryCount: vi.fn(),
  removeMutation: vi.fn(),
  getPendingCount: vi.fn(),
  getMutationById: vi.fn(),
  getQueuedMutations: vi.fn(),
  clearAllMutations: vi.fn(),
}));

vi.mock("@/lib/api/storage/offline-queue", () => ({
  enqueueMutation: (...args: unknown[]) =>
    mockOfflineQueue.enqueueMutation(...args),
  getQueuedMutationsByPriority: (...args: unknown[]) =>
    mockOfflineQueue.getQueuedMutationsByPriority(...args),
  updateMutationStatus: (...args: unknown[]) =>
    mockOfflineQueue.updateMutationStatus(...args),
  incrementRetryCount: (...args: unknown[]) =>
    mockOfflineQueue.incrementRetryCount(...args),
  removeMutation: (...args: unknown[]) =>
    mockOfflineQueue.removeMutation(...args),
  getPendingCount: (...args: unknown[]) =>
    mockOfflineQueue.getPendingCount(...args),
  getMutationById: (...args: unknown[]) =>
    mockOfflineQueue.getMutationById(...args),
  getQueuedMutations: (...args: unknown[]) =>
    mockOfflineQueue.getQueuedMutations(...args),
  clearAllMutations: (...args: unknown[]) =>
    mockOfflineQueue.clearAllMutations(...args),
}));

const setOnline = (value: boolean): void => {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    get: () => value,
  });
};

function createMockMutation(overrides: Record<string, unknown> = {}) {
  return {
    id: "mut_test_1",
    type: "updateProfile",
    payload: { name: "test" },
    endpoint: "/api/profile",
    method: "PUT",
    priority: 3,
    retryCount: 0,
    status: "pending",
    createdAt: Date.now(),
    lastAttemptAt: null,
    errorMessage: null,
    result: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  setOnline(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("processQueue — conflict resolution", () => {
  it("calls resolveMutationConflict when a mutation succeeds", async () => {
    const mutation = createMockMutation();
    mockOfflineQueue.getQueuedMutationsByPriority.mockResolvedValue([
      mutation,
    ]);
    mockOfflineQueue.getPendingCount.mockResolvedValue(0);
    mockHttpClient.request.mockResolvedValue({ name: "server-name" });

    const result = await processQueue();

    expect(mockHttpClient.request).toHaveBeenCalledWith(mutation.endpoint, {
      method: mutation.method,
      body: JSON.stringify(mutation.payload),
    });
    expect(mockOfflineQueue.updateMutationStatus).toHaveBeenCalledWith(
      mutation.id,
      "done",
      null,
      expect.anything(),
    );
    expect(mockOfflineQueue.removeMutation).toHaveBeenCalledWith(mutation.id);
    expect(result.successful).toBe(1);
  });

  it("updates mutation status with resolved data on conflict", async () => {
    const mutation = createMockMutation({
      type: "updateProfile",
      payload: { name: "local-name" },
    });
    mockOfflineQueue.getQueuedMutationsByPriority.mockResolvedValue([
      mutation,
    ]);
    mockOfflineQueue.getPendingCount.mockResolvedValue(0);
    mockHttpClient.request.mockResolvedValue({ name: "server-name" });

    await processQueue();

    expect(mockOfflineQueue.updateMutationStatus).toHaveBeenCalledWith(
      mutation.id,
      "done",
      null,
      { name: "local-name" },
    );
  });

  it("increments conflicts counter when conflict is detected", async () => {
    const mutation = createMockMutation({
      type: "updateProfile",
      payload: { name: "local-name" },
    });
    mockOfflineQueue.getQueuedMutationsByPriority.mockResolvedValue([
      mutation,
    ]);
    mockOfflineQueue.getPendingCount.mockResolvedValue(0);
    mockHttpClient.request.mockResolvedValue({ name: "server-name" });

    const result = await processQueue();

    expect(result.conflicts).toBe(1);
  });

  it("does not increment conflicts when payload matches response", async () => {
    const mutation = createMockMutation({
      type: "updateProfile",
      payload: { name: "same-name" },
    });
    mockOfflineQueue.getQueuedMutationsByPriority.mockResolvedValue([
      mutation,
    ]);
    mockOfflineQueue.getPendingCount.mockResolvedValue(0);
    mockHttpClient.request.mockResolvedValue({ name: "same-name" });

    const result = await processQueue();

    expect(result.conflicts).toBe(0);
  });
});

describe("queueMutation — inline conflict resolution", () => {
  it("returns resolved data when online and conflict exists", async () => {
    mockHttpClient.request.mockResolvedValue({ name: "server-name" });

    const result = await queueMutation(
      "updateProfile",
      { name: "local-name" },
      "/api/profile",
    );

    expect(result).toEqual({
      online: true,
      queued: false,
      data: { name: "local-name" },
    });
  });

  it("returns server data when no conflict online", async () => {
    mockHttpClient.request.mockResolvedValue({ name: "same" });

    const result = await queueMutation(
      "updateProfile",
      { name: "same" },
      "/api/profile",
    );

    expect(result).toEqual({
      online: true,
      queued: false,
      data: { name: "same" },
    });
  });

  it("enqueues mutation when online request fails", async () => {
    mockHttpClient.request.mockRejectedValue(new Error("Server error"));
    mockOfflineQueue.enqueueMutation.mockResolvedValue("mut_fallback_1");

    const result = await queueMutation(
      "updateProfile",
      { name: "test" },
      "/api/profile",
    );

    expect(mockOfflineQueue.enqueueMutation).toHaveBeenCalled();
    expect(result).toMatchObject({
      online: true,
      queued: true,
      mutationId: "mut_fallback_1",
    });
  });

  it("enqueues mutation when offline", async () => {
    setOnline(false);
    mockOfflineQueue.enqueueMutation.mockResolvedValue("mut_offline_1");
    mockOfflineQueue.getPendingCount.mockResolvedValue(1);

    const result = await queueMutation(
      "updateProfile",
      { name: "test" },
      "/api/profile",
    );

    expect(mockOfflineQueue.enqueueMutation).toHaveBeenCalled();
    expect(result).toEqual({
      online: false,
      queued: true,
      mutationId: "mut_offline_1",
    });
  });
});
