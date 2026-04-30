import { Job } from '@rlanz/bull-queue'
import mail from '@adonisjs/mail/services/main'
import ExpenseRejectedMail from '#mails/expense_rejected_mail'

interface Payload {
  to: string
  expenseId: string
  reason: string
}

export default class SendEmailJob extends Job {
  static get $$filepath() {
    return import.meta.url
  }

  async handle(payload: Payload): Promise<void> {
    await mail.send(new ExpenseRejectedMail(payload))
  }

  async rescue(payload: Payload, error: Error): Promise<void> {
    console.error(`SendEmailJob failed for ${payload.to}:`, error.message)
  }
}
