import { Injectable } from '@angular/core'

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

@Injectable({ providedIn: 'root' })
export class DataCacheService {
  /**
   * Lightweight in-memory TTL cache used by {@link SurrealdbService}.
   *
   * Warum existiert dieser Service?
   * - Der SurrealDB-Service braucht ein kleines Cache-Overlay, um doppelte SELECT/QUERY-Requests
   *   im öffentlichen Bereich zu reduzieren (Kategorie-/Detailseiten, Volltextsuche).
   * - Für Admin-/Schreiboperationen wird der Cache entweder komplett invalidiert (Login, Mutationen)
   *   oder bewusst umgangen (SurrealdbService prüft die aktuelle Route). Dadurch sehen Admins immer
   *   Live-Daten.
   * - Der Cache bleibt bewusst in einem eigenen Service, damit:
   *   1. die Logik testbar und wiederverwendbar bleibt,
   *   2. keine Angular-spezifischen Abhängigkeiten (Router, environment) in diesen Store wandern,
   *   3. wir bei Bedarf eine andere Persistenzstrategie hinterlegen könnten, ohne den Surreal-Service
   *      anzupassen.
   *
   * Architektur:
   * - `store`: Map-Key → { value, expiresAt } für schnelle TTL-Lookups.
   * - `inFlight`: Promise-Dedupe, damit parallele `getOrFetch`-Aufrufe dieselbe Anfrage teilen.
   * - Keine Persistenz (IndexedDB/localStorage), damit Logout/Sitzungswechsel garantiert frische Daten
   *   liefert und der Service SSR-/Node-Tests nicht blockiert.
   */
  private readonly store = new Map<string, CacheEntry<unknown>>()
  private readonly inFlight = new Map<string, Promise<unknown>>()

  /**
   * Returns the cached value if present and still valid.
   * Expired entries are evicted eagerly.
   */
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
    if (value === undefined || value === null) {
      this.store.delete(key)
      return
    }
    const expiresAt = Date.now() + ttlMs
    this.store.set(key, { value, expiresAt })
  }

  /**
   * Returns cached data or executes the provided fetcher while deduplicating concurrent calls.
   * The result is stored for the specified TTL unless the fetcher resolves to null/undefined.
   */
  async getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttlMs: number): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== undefined) {
      return cached
    }

    if (this.inFlight.has(key)) {
      return (this.inFlight.get(key) as Promise<T>)!
    }

    const request = fetcher()
      .then((result) => {
        this.set(key, result, ttlMs)
        return result
      })
      .finally(() => {
        this.inFlight.delete(key)
      })

    this.inFlight.set(key, request as unknown as Promise<unknown>)
    return request
  }

  /**
   * Alias that keeps older call sites readable until they are updated to `getOrFetch`.
   */
  async remember<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    return await this.getOrFetch(key, fetcher, ttlMs)
  }

  /** Removes a single cache entry plus any inflight request for the same key. */
  invalidate(key: string): void {
    this.store.delete(key)
    this.inFlight.delete(key)
  }

  /** Bulk invalidation helper used when tables or generic queries change. */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key)
      }
    }
    for (const key of this.inFlight.keys()) {
      if (key.startsWith(prefix)) {
        this.inFlight.delete(key)
      }
    }
  }

  /** Clears the entire cache – typically used during logout. */
  clear(): void {
    this.store.clear()
    this.inFlight.clear()
  }
}
