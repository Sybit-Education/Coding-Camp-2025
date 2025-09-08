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
  readonly allTopics = signal<Topic[]>([]);
  
  constructor() {
    // Initialisiere Daten beim Start
    this.initializeData();
  }
  
  // Öffentliche Methode zur Initialisierung der Datenbankverbindung
  async initializeDatabase(): Promise<void> {
    await this.surrealdb.initialize();
  }
  
  private async initializeData(): Promise<void> {
    try {
      const topics = await this.fetchAllTopics();
      this.allTopics.set(topics);
    } catch (error) {
      console.error('Fehler beim Initialisieren der Topic-Daten:', error);
    }
  }
  
  private async fetchAllTopics(): Promise<Topic[]> {
    try {
      const result = await this.surrealdb.getAll<Topic>('topic')
      return (result || []).map(
        (item: Record<string, unknown>) => ({...item}) as unknown as Topic
      )
    } catch (error) {
      console.error('Fehler beim Laden der Topics:', error);
      return [];
    }
  }

  //************** GET **************

  async getTopicByID(id: RecordId<'topic'> | StringRecordId): Promise<Topic> {
    return await this.surrealdb.getByRecordId<Topic>(id)
  }

  async getAllTopics(): Promise<Topic[]> {
    // Verwende gecachte Daten, wenn verfügbar
    const cachedTopics = this.allTopics();
    if (cachedTopics.length > 0) {
      return cachedTopics;
    }
    
    // Andernfalls lade Daten und aktualisiere Signal
    const topics = await this.fetchAllTopics();
    this.allTopics.set(topics);
    return topics;
  }

  //************** POST **************

  async postTopic(topic: Topic): Promise<Topic> {
    const result: Topic[] = await this.surrealdb.post<Topic>('topic', topic)
    return result[0]
  }
}
