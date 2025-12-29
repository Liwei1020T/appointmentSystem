type CacheEntry<T> = {
  expiresAt: number;
  promise: Promise<T>;
};

const DEFAULT_TTL_MS = 15000;
const requestCache = new Map<string, CacheEntry<unknown>>();

export interface RequestCacheOptions {
  ttlMs?: number;
  skipCache?: boolean;
}

export function cachedRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: RequestCacheOptions = {}
): Promise<T> {
  if (options.skipCache) {
    return fetcher();
  }

  const now = Date.now();
  const cached = requestCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.promise as Promise<T>;
  }

  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const promise = fetcher().catch((error) => {
    requestCache.delete(key);
    throw error;
  });

  requestCache.set(key, { expiresAt: now + ttlMs, promise });
  return promise;
}

export function invalidateRequestCache(key: string) {
  requestCache.delete(key);
}

export function invalidateRequestCacheByPrefix(prefix: string) {
  for (const key of requestCache.keys()) {
    if (key.startsWith(prefix)) {
      requestCache.delete(key);
    }
  }
}
