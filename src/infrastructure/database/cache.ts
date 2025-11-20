/**
 * 简单的内存缓存实现
 * 用于缓存用户配置和常用查询结果
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // 毫秒
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取所有缓存键
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

// 单例导出
export const cache = new MemoryCache();

// 定期清理过期缓存（每5分钟）
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

// ========================================
// 缓存辅助函数
// ========================================

/**
 * 带缓存的数据获取
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 60000
): Promise<T> {
  // 尝试从缓存获取
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // 缓存未命中，执行获取
  const data = await fetcher();

  // 存入缓存
  cache.set(key, data, ttl);

  return data;
}

/**
 * 使缓存失效
 */
export function invalidateCache(pattern: string): void {
  // 简单实现：删除所有匹配的键
  const keys = cache.keys();
  for (const key of keys) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

