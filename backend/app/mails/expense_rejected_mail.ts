import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'

interface Payload {
  to: string
  expenseId: string
  reason: string
}

export default class ExpenseRejectedMail extends BaseMail {
  from = env.get('MAIL_FROM')
  subject = 'Your expense submission was rejected'

  constructor(private payload: Payload) {
    super()
  }

  prepare() {
    this.message.to(this.payload.to).htmlView('emails/expense_rejected', {
      expenseId: this.payload.expenseId,
      reason: this.payload.reason,
    })
  }
}
