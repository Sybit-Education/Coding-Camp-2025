import { Injectable } from '@angular/core'
import Surreal, { Token } from 'surrealdb'
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
    return jwtToken
  }

  override async authenticate(token: Token): Promise<true> {
    return await super.authenticate(token)
  }
}
