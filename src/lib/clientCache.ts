"use client";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const memoryStore = new Map<string, CacheEntry<any>>();

export function getClientCache<T>(key: string, maxAgeMs: number = 120000): T | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > (entry.ttl || maxAgeMs)) {
    memoryStore.delete(key);
    return null;
  }

  return entry.data as T;
}

export function setClientCache<T>(key: string, data: T, ttlMs: number = 120000): void {
  if (typeof window === "undefined") return;
  memoryStore.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  });
}

export function invalidateClientCache(prefix?: string): void {
  if (!prefix) {
    memoryStore.clear();
    return;
  }

  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key);
    }
  }
}
