import { LRUCache } from "lru-cache";

// Rate limiter menggunakan LRU Cache
// Setiap IP address memiliki token bucket yang di-reset setiap 1 menit

type RateLimitOptions = {
  interval: number; // dalam ms
  uniqueTokenPerInterval: number; // jumlah unique keys
};

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    check: (limit: number, token: string): { success: boolean; remaining: number } => {
      const tokenCount = tokenCache.get(token) || [0];
      
      if (tokenCount[0] === 0) {
        tokenCache.set(token, [1]);
        return { success: true, remaining: limit - 1 };
      }

      const currentCount = tokenCount[0];
      
      if (currentCount >= limit) {
        return { success: false, remaining: 0 };
      }

      tokenCache.set(token, [currentCount + 1]);
      return { success: true, remaining: limit - currentCount - 1 };
    },
  };
}

// Helper function untuk get IP dari request
export function getClientIP(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0] ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
