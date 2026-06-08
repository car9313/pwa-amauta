import { describe, it, expect } from "vitest";
import {
  lastWriteWins,
  serverWins,
  clientWins,
  mergeNumbers,
  mergeObjects,
  resolveConflict,
  hasConflict,
  withTimestamps,
  getTimestamp,
  resolveMutationConflict,
} from "./conflict";
import type { ConflictData, ConflictStrategy } from "./conflict";

describe("lastWriteWins", () => {
  const local = { score: 100 };
  const server = { score: 80 };

  it("returns local when local timestamp is newer (greater)", () => {
    const result = lastWriteWins(local, server, 2000, 1000);
    expect(result.data).toEqual(local);
    expect(result.source).toBe("local");
    expect(result.reason).toContain("newer");
  });

  it("returns local when timestamps are equal", () => {
    const result = lastWriteWins(local, server, 1000, 1000);
    expect(result.data).toEqual(local);
    expect(result.source).toBe("local");
  });

  it("returns server when server timestamp is newer", () => {
    const result = lastWriteWins(local, server, 1000, 2000);
    expect(result.data).toEqual(server);
    expect(result.source).toBe("server");
    expect(result.reason).toContain("newer");
  });

  it("works with primitive values", () => {
    expect(lastWriteWins(10, 20, 100, 50).data).toBe(10);
    expect(lastWriteWins("a", "b", 50, 100).data).toBe("b");
  });
});

describe("serverWins", () => {
  it("always returns server data regardless of local", () => {
    const result = serverWins({ mine: true }, { server: true });
    expect(result.data).toEqual({ server: true });
    expect(result.source).toBe("server");
  });

  it("works with null local data", () => {
    const result = serverWins(null, { default: true });
    expect(result.data).toEqual({ default: true });
  });
});

describe("clientWins", () => {
  it("always returns local data regardless of server", () => {
    const result = clientWins({ local: true }, { server: true });
    expect(result.data).toEqual({ local: true });
    expect(result.source).toBe("local");
  });

  it("works with null server data", () => {
    const result = clientWins({ local: true }, null);
    expect(result.data).toEqual({ local: true });
  });
});

describe("mergeNumbers", () => {
  it("adds local and server numbers", () => {
    expect(mergeNumbers(10, 20)).toBe(30);
  });

  it("works with negative numbers", () => {
    expect(mergeNumbers(-5, 3)).toBe(-2);
  });

  it("works with zero", () => {
    expect(mergeNumbers(0, 0)).toBe(0);
    expect(mergeNumbers(100, 0)).toBe(100);
  });

  it("works with decimals", () => {
    expect(mergeNumbers(1.5, 2.5)).toBe(4);
  });
});

describe("mergeObjects", () => {
  it("merges number values by addition", () => {
    const local = { score: 10, name: "local" };
    const server = { score: 20, name: "server" };
    expect(mergeObjects(local, server, "score")).toBe(30);
  });

  it("merges object values by spreading", () => {
    const local = { meta: { a: 1, b: 2 } } as Record<string, unknown>;
    const server = { meta: { b: 99, c: 3 } } as Record<string, unknown>;
    const result = mergeObjects(local, server, "meta");
    expect(result).toEqual({ b: 2, c: 3, a: 1 });
  });

  it("falls back to local value when exists", () => {
    const local = { name: "local" };
    const server = { name: "server" };
    expect(mergeObjects(local, server, "name")).toBe("local");
  });

  it("falls back to server value when local is undefined", () => {
    const local = { other: true } as Record<string, unknown>;
    const server = { name: "server" };
    expect(mergeObjects(local, server, "name")).toBe("server");
  });

  it("returns undefined when neither local nor server has the key", () => {
    const local = { a: 1 } as Record<string, unknown>;
    const server = { b: 2 } as Record<string, unknown>;
    expect(mergeObjects(local, server, "missing")).toBeUndefined();
  });
});

describe("resolveConflict", () => {
  const data: ConflictData<{ x: number }> = {
    local: { x: 1 },
    server: { x: 2 },
    localTimestamp: 2000,
    serverTimestamp: 1000,
  };

  it('dispatches "last-write-wins" strategy', () => {
    const result = resolveConflict("last-write-wins", data);
    expect(result.data).toEqual({ x: 1 });
    expect(result.source).toBe("local");
  });

  it('dispatches "server-wins" strategy', () => {
    const result = resolveConflict("server-wins", data);
    expect(result.data).toEqual({ x: 2 });
    expect(result.source).toBe("server");
  });

  it('dispatches "client-wins" strategy', () => {
    const result = resolveConflict("client-wins", data);
    expect(result.data).toEqual({ x: 1 });
    expect(result.source).toBe("local");
  });

  it('dispatches "merge" strategy by spreading server then local', () => {
    const mergeData: ConflictData<{ score: number; name: string }> = {
      local: { score: 10, name: "local" },
      server: { score: 5, name: "server" },
      localTimestamp: 0,
      serverTimestamp: 0,
    };
    const result = resolveConflict("merge", mergeData);
    expect(result.data).toEqual({ score: 10, name: "local" });
    expect(result.source).toBe("merged");
  });

  it("falls back to last-write-wins for unknown strategy", () => {
    const result = resolveConflict("unknown" as ConflictStrategy, data);
    expect(result.data).toEqual({ x: 1 });
    expect(result.source).toBe("local");
  });
});

describe("hasConflict", () => {
  it("returns false when objects are identical", () => {
    expect(hasConflict({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(false);
  });

  it("returns true when objects differ", () => {
    expect(hasConflict({ a: 1 }, { a: 2 })).toBe(true);
  });

  it("returns false for same primitive values", () => {
    expect(hasConflict(42, 42)).toBe(false);
  });

  it("returns true for different primitive values", () => {
    expect(hasConflict(42, 99)).toBe(true);
  });

  it("detects added keys", () => {
    expect(hasConflict({ a: 1 }, { a: 1, b: 2 })).toBe(true);
  });

  it("detects different order in arrays", () => {
    expect(hasConflict([1, 2], [2, 1])).toBe(true);
  });
});

describe("withTimestamps", () => {
  it("adds __localTimestamp to the object", () => {
    const result = withTimestamps({ name: "test" }, 12345);
    expect(result).toEqual({ name: "test", __localTimestamp: 12345 });
  });

  it("does not mutate the original object", () => {
    const original = { name: "test" };
    const result = withTimestamps(original, 12345);
    expect(original).not.toHaveProperty("__localTimestamp");
    expect(result.__localTimestamp).toBe(12345);
  });

  it("works with empty objects", () => {
    expect(withTimestamps({}, 0)).toEqual({ __localTimestamp: 0 });
  });
});

describe("getTimestamp", () => {
  it("returns __localTimestamp when present", () => {
    expect(getTimestamp({ __localTimestamp: 999 })).toBe(999);
  });

  it("returns current time when __localTimestamp is missing", () => {
    const before = Date.now();
    const result = getTimestamp({});
    const after = Date.now();
    expect(result).toBeGreaterThanOrEqual(before);
    expect(result).toBeLessThanOrEqual(after);
  });

  it("returns current time when __localTimestamp is undefined", () => {
    const result = getTimestamp({} as Record<string, never>);
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThan(0);
  });
});

describe("resolveMutationConflict", () => {
  it("returns no-conflict when payload and response are identical", () => {
    const result = resolveMutationConflict(
      "updateProfile",
      { name: "test" },
      { name: "test" },
      1000,
    );
    expect(result.source).toBe("no-conflict");
    expect(result.resolved).toEqual({ name: "test" });
  });

  it("uses server-wins strategy for login mutations", () => {
    const result = resolveMutationConflict(
      "login",
      { email: "a@b.com", password: "secret" },
      { user: { id: "1", name: "Test" }, token: "abc" },
      1000,
    );
    expect(result.source).toBe("server");
    expect(result.resolved).toEqual({ user: { id: "1", name: "Test" }, token: "abc" });
  });

  it("uses server-wins strategy for submitAnswer mutations", () => {
    const result = resolveMutationConflict(
      "submitAnswer",
      { answer: "15/8" },
      { correct: true, points: 10, answer: "15/8" },
      2000,
    );
    expect(result.source).toBe("server");
    expect(result.resolved).toEqual({ correct: true, points: 10, answer: "15/8" });
  });

  it("uses merge strategy for updateProgress mutations", () => {
    const result = resolveMutationConflict(
      "updateProgress",
      { points: 5, streakDays: 1 },
      { points: 10, streakDays: 3, level: 2 },
      1000,
    );
    expect(result.source).toBe("merged");
    expect(result.resolved).toEqual({ points: 5, streakDays: 1, level: 2 });
  });

  it("uses last-write-wins strategy for updateProfile mutations", () => {
    const FAR_FUTURE = Date.now() + 100_000;
    const result = resolveMutationConflict(
      "updateProfile",
      { name: "new-name" },
      { name: "server-name", email: "a@b.com" },
      FAR_FUTURE,
    );
    expect(result.source).toBe("local");
    expect(result.resolved).toEqual({ name: "new-name" });
  });

  it("uses last-write-wins for unknown mutation types", () => {
    const FAR_FUTURE = Date.now() + 100_000;
    const result = resolveMutationConflict(
      "unknownType",
      { local: true },
      { server: true },
      FAR_FUTURE,
    );
    expect(result.source).toBe("local");
  });

  it("reads __serverTimestamp from response for last-write-wins comparison", () => {
    const result = resolveMutationConflict(
      "updateProfile",
      { name: "local" },
      { name: "server", __serverTimestamp: 9999 },
      1000,
    );
    expect(result.source).toBe("server");
    expect(result.resolved).toEqual({ name: "server", __serverTimestamp: 9999 });
  });

  it("falls back to Date.now() when response has no __serverTimestamp", () => {
    const result = resolveMutationConflict(
      "updateProfile",
      { name: "local" },
      { name: "server" },
      9999999999999,
    );
    expect(result.source).toBe("local");
  });

  it("handles primitive payloads", () => {
    const result = resolveMutationConflict(
      "updateProfile",
      "old-value",
      "new-value",
      1000,
    );
    expect(result.source).toBe("server");
  });
});
