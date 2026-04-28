import User from '#models/user'
import Expense from '#models/expense'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class ExpensePolicy extends BasePolicy {
  private isHrOrAdmin(user: User): boolean {
    return user.role === 'hr' || user.role === 'admin'
  }

  view(user: User, expense: Expense): AuthorizerResponse {
    if (this.isHrOrAdmin(user)) return true
    return expense.userId === user.id
  }

  create(_user: User): AuthorizerResponse {
    return true
  }

  approve(user: User): AuthorizerResponse {
    return this.isHrOrAdmin(user)
  }

  reject(user: User): AuthorizerResponse {
    return this.isHrOrAdmin(user)
  }
}
