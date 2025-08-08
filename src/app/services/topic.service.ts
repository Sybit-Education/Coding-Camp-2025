import { inject, Injectable } from '@angular/core'
import { SurrealdbService } from './surrealdb.service'
import { Topic } from '../models/topic.interface'
import { RecordId, StringRecordId } from 'surrealdb'

@Injectable({
  providedIn: 'root',
})
export class TopicService {
  private readonly surrealdb: SurrealdbService = inject(SurrealdbService)

  //************** GET **************

  async getTopicByID(id: RecordId<'topic'> | StringRecordId): Promise<Topic> {
    return await this.surrealdb.getByRecordId<Topic>(id)
  }

  async getAllTopics(): Promise<Topic[]> {
    try {
      const result = await this.surrealdb.getAll<Topic>('topic')
      return (result || []).map(
        (item: Record<string, unknown>) =>
          ({
            ...item
          }) as unknown as Topic,
      )
    } catch (error) {
      throw new Error(`Fehler beim Laden der Topics: ${error}`)
    }
  }

  //************** POST **************

  async postTopic(topic: Topic): Promise<Topic> {
    const result: Topic[] = await this.surrealdb.post<Topic>('topic', topic)
    return result[0]
  }
}
