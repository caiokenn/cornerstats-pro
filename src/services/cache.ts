/**
 * Simple in-memory cache for API responses
 */
class CacheService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private defaultTTL: number = 60 * 1000; // 1 minute default

  set(key: string, data: any, ttl: number = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.timestamp) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear() {
    this.cache.clear();
  }
}

export const cacheService = new CacheService();
