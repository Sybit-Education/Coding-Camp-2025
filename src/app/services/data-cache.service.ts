import { Injectable } from '@angular/core'

type CacheEntry<T> = {
  value: T
  expiresAt: number
}

@Injectable({ providedIn: 'root' })
export class DataCacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>()
  private readonly inFlight = new Map<string, Promise<unknown>>()

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key) as CacheEntry<T> | undefined
    if (!entry) return undefined
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key)
      return undefined
    }
    return entry.value
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  async getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttlMs: number, swrMs = 0): Promise<T> {
    const now = Date.now()
    const cached = this.store.get(key) as CacheEntry<T> | undefined

    // Fresh cache
    if (cached && cached.expiresAt > now) {
      return cached.value
    }

    // SWR: return stale immediately and refresh in background
    if (cached && swrMs > 0 && cached.expiresAt <= now && cached.expiresAt + swrMs > now) {
      if (!this.inFlight.has(key)) {
        const bg = fetcher()
          .then((value) => {
            this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
            this.inFlight.delete(key)
            return value as unknown as T
          })
          .catch(() => {
            this.inFlight.delete(key)
            return cached.value
          })
        this.inFlight.set(key, bg)
      }
      return cached.value
    }

    // Deduplicate concurrent fetches
    if (this.inFlight.has(key)) {
      return (this.inFlight.get(key) as Promise<T>)!
    }

    const p = fetcher()
      .then((value) => {
        this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
        this.inFlight.delete(key)
        return value
      })
      .catch((err) => {
        this.inFlight.delete(key)
        throw err
      })

    this.inFlight.set(key, p as Promise<unknown>)
    return p
  }

  invalidate(key: string): void {
    this.store.delete(key)
    this.inFlight.delete(key)
  }

  invalidatePrefix(prefix: string): void {
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) {
        this.store.delete(key)
      }
    }
    for (const key of Array.from(this.inFlight.keys())) {
      if (key.startsWith(prefix)) {
        this.inFlight.delete(key)
      }
    }
  }

  clear(): void {
    this.store.clear()
    this.inFlight.clear()
  }
}
