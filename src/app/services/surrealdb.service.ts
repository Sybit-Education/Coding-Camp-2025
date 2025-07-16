import { Injectable } from '@angular/core'
import Surreal from 'surrealdb'
import { environment } from '../../environments/environment.production'

@Injectable({
  providedIn: 'root',
})
export class SurrealdbService extends Surreal {
  constructor() {
    super()
  }

  async initialize() {
    await this.connect(environment.surrealDbAddress, {
      namespace: environment.surrealDbNamespace,
      database: environment.surrealDbDatabase,
    })
    await this.ready
  }
}
