import { Injectable, inject } from '@angular/core'
import { Router } from '@angular/router'
import Surreal, { RecordId, StringRecordId, Token } from 'surrealdb'
import { environment } from '../../environments/environment'
import { Event as AppEvent } from '../models/event.interface'
import { DataCacheService } from './data-cache.service'
import { Observable, Subject } from 'rxjs'

interface CacheOptions {
  bypassCache?: boolean
}

interface LiveQueryUpdate<T> {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CLOSE'
  result?: T
}

@Injectable({
  providedIn: 'root',
})
export class SurrealdbService extends Surreal {
  private connectionInitialized = false
  private connectionPromise: Promise<void> | null = null
  private readonly cache = inject(DataCacheService)
  private readonly router = inject(Router, { optional: true })
  private readonly defaultTtlMs = 60_000
  private readonly searchTtlMs = 10_000
  
  // Live Query Management
  private readonly liveQueryMap = new Map<string, Subject<LiveQueryUpdate<unknown>>>()

  constructor() {
    super()
  }

  private recordIdToString(recordId: RecordId<string> | StringRecordId): string {
    const asString = (recordId as unknown as { toString?: () => string })?.toString?.()
    if (typeof asString === 'string') {
      return asString
    }
    const tb = (recordId as { tb?: string })?.tb
    const id = (recordId as { id?: unknown })?.id
    if (tb && id !== undefined) {
      return `${tb}:${id}`
    }
    return String(recordId)
  }

  private tableKey(table: string): string {
    return `table:${table}`
  }

  private recordKey(recordId: RecordId<string> | StringRecordId): string {
    return `record:${this.recordIdToString(recordId)}`
  }

  private queryKey(sql: string, params?: Record<string, unknown>): string {
    const serialized =
      params === undefined
        ? ''
        : `:${JSON.stringify(
            Object.keys(params)
              .sort()
              .reduce<Record<string, unknown>>((acc, key) => {
                acc[key] = params[key]
                return acc
              }, {}),
          )}`
    return `query:${sql}${serialized}`
  }

  async initialize() {
    // Wenn bereits eine Initialisierung läuft, warte auf deren Abschluss
    if (this.connectionPromise) {
      return this.connectionPromise
    }

    // Wenn die Verbindung bereits initialisiert ist, nichts tun
    if (this.connectionInitialized) {
      return
    }

    // Initialisiere die Verbindung und speichere das Promise
    this.connectionPromise = this.initializeConnection()
    return this.connectionPromise
  }

  private async initializeConnection(): Promise<void> {
    try {
      await this.connect(environment.surrealDbAddress, {
        namespace: environment.surrealDbNamespace,
        database: environment.surrealDbDatabase,
      })
      await this.ready
      this.connectionInitialized = true
    } catch (error) {
      console.error('Fehler bei der Initialisierung der Verbindung:', error)
      this.connectionPromise = null
      throw error
    }
  }

  async login(username: string, password: string) {
    const jwtToken = await super.signin({
      namespace: environment.surrealDbNamespace,
      database: environment.surrealDbDatabase,
      access: 'user',
      variables: {
        username: username,
        password: password,
      },
    })
    this.cache.clear()
    return jwtToken
  }

  override async authenticate(token: Token): Promise<true> {
    // Ensure connection is initialized before authentication
    await this.initialize()
    return await super.authenticate(token)
  }

  async getByRecordId<T extends Record<string, unknown>>(
    recordId: RecordId<string> | StringRecordId,
    options?: CacheOptions,
  ): Promise<T> {
    // Stelle sicher, dass die Verbindung initialisiert ist
    await this.initialize()
    return await this.fetchCached(
      this.recordKey(recordId),
      this.defaultTtlMs,
      async () => (await super.select<T>(recordId)) as T,
      options,
    )
  }

  // 2) Alle Einträge einer Tabelle holen
  async getAll<T extends Record<string, unknown>>(table: string, options?: CacheOptions): Promise<T[]> {
    // Stelle sicher, dass die Verbindung initialisiert ist
    await this.initialize()
    return await this.fetchCached(this.tableKey(table), this.defaultTtlMs, async () => await super.select<T>(table), options)
  }

  // 3) Einfügen und die neuen Datensätze zurückbekommen
  async post<T extends Record<string, unknown>>(table: string, payload?: T | T[]): Promise<T[]> {
    // Stelle sicher, dass die Verbindung initialisiert ist
    await this.initialize()
    const result = await super.insert<T>(table, payload)
    this.cache.invalidate(this.tableKey(table))
    this.cache.invalidatePrefix('query:')
    return result
  }

  async postUpdate<T extends Record<string, unknown>>(id: RecordId<string> | StringRecordId, payload?: T): Promise<T> {
    try {
      // Stelle sicher, dass die Verbindung initialisiert ist
      await this.initialize()
      const updatedRecord = await super.update<T>(id, payload)

      const table = (id as { tb?: string })?.tb
      this.cache.invalidate(this.recordKey(id))
      if (table) {
        this.cache.invalidate(this.tableKey(table))
      }
      this.cache.invalidatePrefix('query:')

      return updatedRecord
    } catch (error) {
      console.error('Error in postUpdate:', error)
      throw error
    }
  }

  async deleteRow(recordId: RecordId<string> | StringRecordId) {
    // Stelle sicher, dass die Verbindung initialisiert ist
    await this.initialize()
    await super.delete(recordId)

    const table = (recordId as { tb?: string })?.tb
    this.cache.invalidate(this.recordKey(recordId))
    if (table) {
      this.cache.invalidate(this.tableKey(table))
    }
    this.cache.invalidatePrefix('query:')
  }

  async fulltextSearchEvents(searchTerm: string): Promise<AppEvent[]> {
    await this.initialize()

    const q = (searchTerm ?? '').trim()
    if (!q) {
      console.debug('[SurrealdbService] FTS skipped: empty searchTerm')
      return []
    }

    // Gewichtete FTS-Abfrage (name/description/organizer/location/city...)
    const ftsSql = `SELECT 
        *,
        (search::score(0)*3     -- name
          + search::score(1)*2  -- description
          + search::score(2)    -- restriction
          + search::score(3)*2  -- organizer
          + search::score(4)*2  -- location name
          + search::score(5)    -- city
          + search::score(6)    -- event type
          + search::score(7)    -- topic
        ) AS relevance
      FROM event
      WHERE
        name @0@ $q
        OR description @1@ $q
        OR restriction @2@ $q
        OR organizer.name @3@ $q
        OR location.name @4@ $q
        OR location.city @5@ $q
        OR event_type.name @6@ $q
        OR topic.name @7@ $q
      ORDER BY relevance DESC
      LIMIT 30;`

    try {
      const result = await this.fetchCached(this.queryKey(ftsSql, { q }), this.searchTtlMs, async () => {
        const queryResult = (await super.query(ftsSql, { 'q': q }))[0] as AppEvent[]
        return Array.isArray(queryResult) ? queryResult : []
      })
      return result
    } catch (err) {
      console.warn('[SurrealdbService] FTS query failed, will fallback', err)
      return []
    }
    return []
  }

  /**
   * Live Query Support - Returns an Observable that emits updates in real-time
   * @param table The table or query to watch for changes
   * @param diff If true, returns only the changes (default: false)
   * @returns Observable that emits CREATE, UPDATE, DELETE, or CLOSE events
   */
  liveQuery<T extends Record<string, unknown>>(
    table: string,
    diff = false
  ): Observable<LiveQueryUpdate<T>> {
    const subject = new Subject<LiveQueryUpdate<T>>()
    const queryKey = `live:${table}:${diff}`

    // Check if we already have a live query for this
    if (this.liveQueryMap.has(queryKey)) {
      return this.liveQueryMap.get(queryKey) as Observable<LiveQueryUpdate<T>>
    }

    this.liveQueryMap.set(queryKey, subject as Subject<LiveQueryUpdate<unknown>>)

    // Initialize the live query
    void this.initialize()
      .then(async () => {
        try {
          const queryUuid = await super.live<T>(
            table,
            (action, result) => {
              subject.next({ 
                action: action as 'CREATE' | 'UPDATE' | 'DELETE',
                result: result as T
              })
            },
            diff
          )

          // Handle cleanup when observable is unsubscribed
          return () => {
            void super.kill(queryUuid).catch((err) => {
              console.warn('Failed to kill live query:', err)
            })
            this.liveQueryMap.delete(queryKey)
            subject.complete()
          }
        } catch (error) {
          console.error('Failed to create live query:', error)
          subject.error(error)
          return undefined
        }
      })
      .catch((error) => {
        console.error('Failed to initialize connection for live query:', error)
        subject.error(error)
      })

    return subject.asObservable()
  }

  /**
   * Disconnect and cleanup all live queries
   */
  async disconnect(): Promise<void> {
    // Close all live queries
    for (const subject of this.liveQueryMap.values()) {
      subject.complete()
    }
    this.liveQueryMap.clear()

    // Close connection
    if (this.connectionInitialized) {
      await this.close()
      this.connectionInitialized = false
      this.connectionPromise = null
    }
  }

  private async fetchCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>, options?: CacheOptions): Promise<T> {
    if (this.shouldBypassCache(options)) {
      return await fetcher()
    }
    return await this.cache.getOrFetch<T>(key, fetcher, ttlMs)
  }

  private shouldBypassCache(options?: CacheOptions): boolean {
    if (options?.bypassCache) {
      return true
    }
    const url = this.router?.url
    if (typeof url === 'string' && url.startsWith('/admin')) {
      return true
    }
    if (typeof window !== 'undefined' && typeof window.location?.pathname === 'string') {
      return window.location.pathname.startsWith('/admin')
    }
    return false
  }
}
