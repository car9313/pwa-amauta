import Dexie from "dexie";
import type { PersistedClient } from "@tanstack/react-query-persist-client";

const QUERY_CACHE_KEY = "react-query-cache";

interface QueryCacheDB extends Dexie {
  cache: Dexie.Table<{ id: string; data: string }, string>;
}

export const queryCacheDb = new Dexie("amauta-query-cache") as QueryCacheDB;

queryCacheDb.version(1).stores({
  cache: "id",
});

export const createQueryCacheStorage = {
  getClient: async (): Promise<PersistedClient | undefined> => {
    const cached = await queryCacheDb.cache.get(QUERY_CACHE_KEY);
    if (!cached) return undefined;
    try {
      return JSON.parse(cached.data) as PersistedClient;
    } catch {
      return undefined;
    }
  },

  persistClient: async (client: PersistedClient): Promise<void> => {
    await queryCacheDb.cache.put({
      id: QUERY_CACHE_KEY,
      data: JSON.stringify(client),
    });
  },

  removeClient: async (): Promise<void> => {
    await queryCacheDb.cache.delete(QUERY_CACHE_KEY);
  },

  getVersion: async (): Promise<number> => {
    const cached = await queryCacheDb.cache.get(QUERY_CACHE_KEY);
    if (!cached) return 0;
    try {
      const client = JSON.parse(cached.data) as PersistedClient;
      return client.clientState.queries?.length ?? 0;
    } catch {
      return 0;
    }
  },
};