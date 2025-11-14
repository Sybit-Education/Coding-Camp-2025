import { Injectable } from '@angular/core'

type CacheEntry<T> = {
  value: T
  expiresAt: number
}

@Injectable({ providedIn: 'root' })
export class DataCacheService {
  // In-memory store + in-flight dedup
  private readonly store = new Map<string, CacheEntry<unknown>>()
  private readonly inFlight = new Map<string, Promise<unknown>>()

  // Optional persistence
  private readonly usePersistence = typeof indexedDB !== 'undefined'
  private dbPromise: Promise<IDBDatabase> | null = null
  private readonly dbName = 'app-cache'
  private readonly storeName = 'kv'

  // ---- Public API ----

  get<T>(key: string): T | undefined {
    const entry = this.getFromMemory<T>(key)
    return entry ? entry.value : undefined
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs
    this.setInMemory(key, { value, expiresAt })
    void this.setInIdb<T>(key, { value, expiresAt })
  }

  async getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttlMs: number, swrMs = 0): Promise<T> {
    const now = Date.now()

    // 1) In-Memory (fresh)
    const mem = this.getFromMemory<T>(key)
    if (mem && mem.expiresAt > now) {
      return mem.value
    }

    // 2) IndexedDB (fresh)
    const disk = await this.getFromIdb<T>(key)
    if (disk && disk.expiresAt > now) {
      this.setInMemory(key, disk)
      return disk.value
    }

    // 3) SWR (stale but within window) from memory or disk
    const stale = mem ?? disk
    if (stale && swrMs > 0 && stale.expiresAt <= now && stale.expiresAt + swrMs > now) {
      // Background refresh if not already running
      if (!this.inFlight.has(key)) {
        const bg = fetcher()
          .then((value) => {
            const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs }
            this.setInMemory(key, entry)
            return this.setInIdb<T>(key, entry).finally(() => {
              this.inFlight.delete(key)
            })
          })
          .catch(() => {
            this.inFlight.delete(key)
          }) as unknown as Promise<unknown>

        this.inFlight.set(key, bg)
      }
      return stale.value
    }

    // 4) Deduplicate concurrent fetches
    if (this.inFlight.has(key)) {
      return (this.inFlight.get(key) as Promise<T>)!
    }

    // 5) Fetch and persist
    const p = fetcher()
      .then((value) => {
        const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs }
        this.setInMemory(key, entry)
        return this.setInIdb<T>(key, entry).then(() => value)
      })
      .catch((err) => {
        throw err
      })
      .finally(() => {
        this.inFlight.delete(key)
      })

    this.inFlight.set(key, p as unknown as Promise<unknown>)
    return p
  }

  invalidate(key: string): void {
    this.store.delete(key)
    this.inFlight.delete(key)
    void this.deleteFromIdb(key)
  }

  invalidatePrefix(prefix: string): void {
    // Memory
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
    // Disk
    void this.deletePrefixFromIdb(prefix)
  }

  clear(): void {
    this.store.clear()
    this.inFlight.clear()
    void this.clearIdb()
  }

  // ---- Memory helpers ----

  private getFromMemory<T>(key: string): CacheEntry<T> | undefined {
    const entry = this.store.get(key) as CacheEntry<T> | undefined
    if (!entry) return undefined
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key)
      return undefined
    }
    return entry
  }

  private setInMemory<T>(key: string, entry: CacheEntry<T>): void {
    this.store.set(key, entry as CacheEntry<unknown>)
  }

  // ---- IndexedDB helpers ----

  private async openDb(): Promise<IDBDatabase | null> {
    if (!this.usePersistence) return null
    if (this.dbPromise) {
      try {
        return await this.dbPromise
      } catch {
        this.dbPromise = null
      }
    }
    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(this.dbName, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName)
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    try {
      return await this.dbPromise
    } catch {
      this.dbPromise = null
      return null
    }
  }

  private async getFromIdb<T>(key: string): Promise<CacheEntry<T> | undefined> {
    const db = await this.openDb()
    if (!db) return undefined
    return await new Promise<CacheEntry<T> | undefined>((resolve) => {
      const tx = db.transaction(this.storeName, 'readonly')
      const store = tx.objectStore(this.storeName)
      const req = store.get(key)
      req.onsuccess = () => {
        const entry = req.result as CacheEntry<T> | undefined
        if (!entry) return resolve(undefined)
        if (entry.expiresAt <= Date.now()) {
          // Delete stale on read
          const dtx = db.transaction(this.storeName, 'readwrite')
          dtx.objectStore(this.storeName).delete(key)
          resolve(undefined)
        } else {
          resolve(entry)
        }
      }
      req.onerror = () => resolve(undefined)
    })
  }

  private async setInIdb<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    const db = await this.openDb()
    if (!db) return
    await new Promise<void>((resolve) => {
      const tx = db.transaction(this.storeName, 'readwrite')
      tx.objectStore(this.storeName).put(entry, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  }

  private async deleteFromIdb(key: string): Promise<void> {
    const db = await this.openDb()
    if (!db) return
    await new Promise<void>((resolve) => {
      const tx = db.transaction(this.storeName, 'readwrite')
      tx.objectStore(this.storeName).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  }

  private async deletePrefixFromIdb(prefix: string): Promise<void> {
    const db = await this.openDb()
    if (!db) return
    await new Promise<void>((resolve) => {
      const tx = db.transaction(this.storeName, 'readwrite')
      const store = tx.objectStore(this.storeName)
      const req = store.openCursor()
      req.onsuccess = () => {
        const cursor = req.result
        if (cursor) {
          const key = String(cursor.key)
          if (key.startsWith(prefix)) {
            cursor.delete()
          }
          cursor.continue()
        }
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  }

  private async clearIdb(): Promise<void> {
    const db = await this.openDb()
    if (!db) return
    await new Promise<void>((resolve) => {
      const tx = db.transaction(this.storeName, 'readwrite')
      tx.objectStore(this.storeName).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  }
}
