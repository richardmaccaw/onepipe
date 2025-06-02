export interface Cache {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

/**
 * Creates a namespaced cache that prefixes all keys with the given namespace.
 * This allows multiple destinations to share a single KV store without key conflicts.
 */
export function createNamespacedCache(
  kv: KVNamespace, 
  namespace: string
): Cache {
  return {
    get: (key) => kv.get(`${namespace}:${key}`),
    put: (key, value, options) => kv.put(`${namespace}:${key}`, value, options),
    delete: (key) => kv.delete(`${namespace}:${key}`)
  }
} 