interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

export class CacheManager {
    private cache: Map<string, CacheEntry<string>> = new Map();
    private maxSize: number = 100;
    private defaultTTL: number = 3600000; // 1 hour in milliseconds

    set<T>(key: string, value: T, ttl?: number): void {
        const expirationTime = ttl || this.defaultTTL;
        const entry: CacheEntry<string> = {
            data: JSON.stringify(value),
            timestamp: Date.now(),
            expiresAt: Date.now() + expirationTime,
        };

        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        this.cache.set(key, entry);
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        try {
            return JSON.parse(entry.data) as T;
        } catch {
            this.cache.delete(key);
            return null;
        }
    }

    has(key: string): boolean {
        const entry = this.cache.get(key);

        if (!entry) {
            return false;
        }

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTime: number = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    getSize(): number {
        return this.cache.size;
    }

    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }

    setMaxSize(size: number): void {
        this.maxSize = size;
        while (this.cache.size > this.maxSize) {
            this.evictOldest();
        }
    }

    setDefaultTTL(ttl: number): void {
        this.defaultTTL = ttl;
    }

    getCacheStats(): { size: number; maxSize: number; hitRate: number } {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: 0, // Would need hit/miss tracking for accurate hit rate
        };
    }
}

export const videoCache = new CacheManager();
export const templateCache = new CacheManager();
export const assetCache = new CacheManager();
