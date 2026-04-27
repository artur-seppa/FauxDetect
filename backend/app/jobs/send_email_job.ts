import { Job } from '@rlanz/bull-queue'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'

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
    await mail.send((message) => {
      message
        .to(payload.to)
        .from(env.get('MAIL_FROM'))
        .subject('Your expense submission was rejected')
        .html(
          `<p>Your expense <strong>#${payload.expenseId}</strong> was automatically rejected.</p>
           <p><strong>Reason:</strong> ${payload.reason}</p>
           <p>If you believe this is an error, please contact your HR team.</p>`
        )
    })
  }

  async rescue(payload: Payload, error: Error): Promise<void> {
    console.error(`SendEmailJob failed for ${payload.to}:`, error.message)
  }
}
