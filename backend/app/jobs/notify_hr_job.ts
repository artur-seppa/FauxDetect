import { Job } from '@rlanz/bull-queue'
import mail from '@adonisjs/mail/services/main'
import User from '#models/user'
import NotifyHrMail from '#mails/notify_hr_mail'

interface Payload {
  expenseId: string
  employeeName: string
  status: 'pending' | 'manual_review'
  fraudDetails: string
}

export default class NotifyHrJob extends Job {
  static get $$filepath() {
    return import.meta.url
  }

  async handle(payload: Payload): Promise<void> {
    const recipients = await User.query().whereIn('role', ['hr', 'admin'])

    await Promise.all(
      recipients.map((user) =>
        mail.send(
          new NotifyHrMail({
            recipientEmail: user.email,
            expenseId: payload.expenseId,
            employeeName: payload.employeeName,
            status: payload.status,
            fraudDetails: payload.fraudDetails,
          })
        )
      )
    )
  }

  async rescue(payload: Payload, error: Error): Promise<void> {
    console.error(`NotifyHrJob failed for expense ${payload.expenseId}:`, error.message)
  }
}
