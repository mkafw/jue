export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

export class CacheService {
  private kv: KVNamespace | null = null;
  private memoryCache: Map<string, { data: any; expires: number }> = new Map();
  private defaultTTL: number;
  private prefix: string;

  constructor(kv?: KVNamespace, options: CacheOptions = {}) {
    this.kv = kv || null;
    this.defaultTTL = options.ttl || 3600;
    this.prefix = options.prefix || 'qa';
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = `${this.prefix}:${key}`;
    
    const memEntry = this.memoryCache.get(fullKey);
    if (memEntry && memEntry.expires > Date.now()) {
      return memEntry.data as T;
    }

    if (this.kv) {
      const cached = await this.kv.get<T>(fullKey, 'json');
      if (cached) {
        this.memoryCache.set(fullKey, {
          data: cached,
          expires: Date.now() + this.defaultTTL * 1000,
        });
        return cached;
      }
    }

    return null;
  }

  async set(key: string, data: any, ttl?: number): Promise<void> {
    const fullKey = `${this.prefix}:${key}`;
    const expires = Date.now() + (ttl || this.defaultTTL) * 1000;

    this.memoryCache.set(fullKey, { data, expires });

    if (this.kv) {
      await this.kv.put(fullKey, JSON.stringify(data), {
        expirationTtl: ttl || this.defaultTTL,
      });
    }
  }

  async delete(key: string): Promise<void> {
    const fullKey = `${this.prefix}:${key}`;
    this.memoryCache.delete(fullKey);

    if (this.kv) {
      await this.kv.delete(fullKey);
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
  }

  setTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }
}
