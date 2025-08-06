import { inject, Injectable } from "@angular/core";
import { SurrealdbService } from "./surrealdb.service";
import { Topic } from "../models/topic.interface";

@Injectable({
  providedIn: 'root',
})
export class TopicService {

  private surrealdb: SurrealdbService = inject(SurrealdbService)

  //************** GET **************

  async getTopicByID(id: string): Promise<Topic> {
    return await this.surrealdb.getById<Topic>(id)
  }

  async getAllTopics(): Promise<Topic[]> {
    try {
      const result = await this.surrealdb.getAll<Topic>('event')
      return (result || []).map(
        (item: Record<string, unknown>) =>
          ({
            ...item,
            id: item['id']?.toString() || '',
            name: item['name']?.toString || '',
          }) as unknown as Topic,
      )
    } catch (error) {
      throw new Error(`Fehler beim Laden der Events: ${error}`)
    }
  }

  //************** POST **************

  async postTopic(topic: Topic): Promise<Topic> {
    const result: Topic[] = await this.surrealdb.post<Topic>('topic', topic)
    return result[0]
  }
}