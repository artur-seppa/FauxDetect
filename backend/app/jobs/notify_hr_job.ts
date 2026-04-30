import { Job } from '@rlanz/bull-queue'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import User from '#models/user'

interface Payload {
  expenseId: string
  employeeName: string
  status: 'pending' | 'manual_review'
}

export default class NotifyHrJob extends Job {
  static get $$filepath() {
    return import.meta.url
  }

  async handle(payload: Payload): Promise<void> {
    const recipients = await User.query().whereIn('role', ['hr', 'admin'])

    const subject =
      payload.status === 'manual_review'
        ? `[FauxDetect] Manual review required — expense #${payload.expenseId}`
        : `[FauxDetect] New expense submitted — expense #${payload.expenseId}`

    const body =
      payload.status === 'manual_review'
        ? `<p>Expense <strong>#${payload.expenseId}</strong> submitted by <strong>${payload.employeeName}</strong> requires manual review due to suspicious signals.</p>`
        : `<p>A new expense <strong>#${payload.expenseId}</strong> was submitted by <strong>${payload.employeeName}</strong> and is awaiting your review.</p>`

    await Promise.all(
      recipients.map((user) =>
        mail.send((message) => {
          message.to(user.email).from(env.get('MAIL_FROM')).subject(subject).html(body)
        })
      )
    )
  }

  async rescue(payload: Payload, error: Error): Promise<void> {
    console.error(`NotifyHrJob failed for expense ${payload.expenseId}:`, error.message)
  }
}
