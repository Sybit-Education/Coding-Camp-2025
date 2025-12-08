import { inject, Injectable, signal } from '@angular/core'
import { SurrealdbService } from './surrealdb.service'
import { Topic } from '../models/topic.interface'
import { RecordId, StringRecordId } from 'surrealdb'

@Injectable({
  providedIn: 'root',
})
export class TopicService {
  private readonly surrealdb: SurrealdbService = inject(SurrealdbService)

  // Signal für reaktiven State
  readonly allTopics = signal<Topic[]>([])

  async initializeData(): Promise<void> {
    try {
      const topics = await this.fetchAllTopics()
      this.allTopics.set(topics)
    } catch (error) {
      console.error('Fehler beim Initialisieren der Topic-Daten:', error)
    }
  }

  private async fetchAllTopics(): Promise<Topic[]> {
    try {
      const result = await this.surrealdb.getAll<Topic>('topic')
      return (result || []).map((item: Record<string, unknown>) => ({ ...item }) as unknown as Topic)
    } catch (error) {
      console.error('Fehler beim Laden der Topics:', error)
      return []
    }
  }

  //************** GET **************

  async getTopicByID(id: RecordId<'topic'> | StringRecordId): Promise<Topic> {
    return await this.surrealdb.getByRecordId<Topic>(id)
  }

  // Timestamp für Cache-Invalidierung
  private lastTopicsFetch = 0
  private readonly CACHE_TTL = 300000 // 5 Minuten Cache-Gültigkeit

  async getAllTopics(): Promise<Topic[]> {
    // Verwende gecachte Daten, wenn verfügbar und nicht zu alt
    const cachedTopics = this.allTopics()
    const now = Date.now()

    if (cachedTopics.length > 0 && now - this.lastTopicsFetch < this.CACHE_TTL) {
      return cachedTopics
    }

    // Andernfalls lade Daten und aktualisiere Signal
    const topics = await this.fetchAllTopics()
    this.allTopics.set(topics)
    this.lastTopicsFetch = now
    return topics
  }

  //************** POST **************

  async postTopic(topic: Topic): Promise<Topic> {
    const result: Topic[] = await this.surrealdb.post<Topic>('topic', topic)
    return result[0]
  }

  isTopicHighlight(topic: Topic): boolean {
    if (topic.name === 'Highlights') return true
    return false
  }

  isTopicAccessibility(topic: Topic): boolean {
    if (topic.name === 'Barrierefrei') return true
    return false
  }
}
