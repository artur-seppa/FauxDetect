import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class CategoryPolicy extends BasePolicy {
  private isHrOrAdmin(user: User): boolean {
    return user.role === 'hr' || user.role === 'admin'
  }

  create(user: User): AuthorizerResponse {
    return this.isHrOrAdmin(user)
  }

  update(user: User): AuthorizerResponse {
    return this.isHrOrAdmin(user)
  }

  delete(user: User): AuthorizerResponse {
    return this.isHrOrAdmin(user)
  }
}
