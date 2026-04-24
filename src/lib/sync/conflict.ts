export type ConflictStrategy = "last-write-wins" | "server-wins" | "client-wins" | "merge";

export interface ConflictData<T> {
  local: T;
  server: T;
  localTimestamp: number;
  serverTimestamp: number;
}

export interface ConflictResult<T> {
  data: T;
  source: "local" | "server" | "merged";
  reason: string;
}

export function lastWriteWins<T>(
  local: T,
  server: T,
  localTimestamp: number,
  serverTimestamp: number
): ConflictResult<T> {
  if (localTimestamp >= serverTimestamp) {
    return {
      data: local,
      source: "local",
      reason: `Local data (${new Date(localTimestamp).toISOString()}) is newer than server (${new Date(serverTimestamp).toISOString()})`,
    };
  }

  return {
    data: server,
    source: "server",
    reason: `Server data (${new Date(serverTimestamp).toISOString()}) is newer than local (${new Date(localTimestamp).toISOString()})`,
  };
}

export function serverWins<T>(_local: T, server: T): ConflictResult<T> {
  return {
    data: server,
    source: "server",
    reason: "Server data always wins (server-wins strategy)",
  };
}

export function clientWins<T>(local: T, _server: T): ConflictResult<T> {
  return {
    data: local,
    source: "local",
    reason: "Local data always wins (client-wins strategy)",
  };
}

export function mergeNumbers(local: number, server: number): number {
  return local + server;
}

export function mergeObjects<T extends Record<string, unknown>>(
  local: T,
  server: T,
  key: string
): unknown {
  const localValue = local[key];
  const serverValue = server[key];

  if (typeof localValue === "number" && typeof serverValue === "number") {
    return mergeNumbers(localValue, serverValue);
  }

  if (typeof localValue === "object" && typeof serverValue === "object") {
    return { ...serverValue, ...localValue };
  }

  return localValue ?? serverValue;
}

export function resolveConflict<T>(
  strategy: ConflictStrategy,
  data: ConflictData<T>
): ConflictResult<T> {
  switch (strategy) {
    case "last-write-wins":
      return lastWriteWins(
        data.local,
        data.server,
        data.localTimestamp,
        data.serverTimestamp
      );

    case "server-wins":
      return serverWins(data.local, data.server);

    case "client-wins":
      return clientWins(data.local, data.server);

    case "merge":
      return {
        data: { ...data.server, ...data.local },
        source: "merged",
        reason: "Merged local and server data",
      };

    default:
      return lastWriteWins(
        data.local,
        data.server,
        data.localTimestamp,
        data.serverTimestamp
      );
  }
}

export const DEFAULT_STRATEGY: ConflictStrategy = "last-write-wins";

export function hasConflict<T>(local: T, server: T): boolean {
  return JSON.stringify(local) !== JSON.stringify(server);
}

export interface TimestampMetadata {
  __localTimestamp?: number;
  __serverTimestamp?: number;
}

export function withTimestamps<T extends object>(
  data: T,
  timestamp: number
): T & TimestampMetadata {
  return { ...data, __localTimestamp: timestamp };
}

export function getTimestamp<T extends TimestampMetadata>(data: T): number {
  return data.__localTimestamp ?? Date.now();
}