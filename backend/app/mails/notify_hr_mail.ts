import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'

interface Payload {
  recipientEmail: string
  expenseId: string
  employeeName: string
  status: 'pending' | 'manual_review'
  fraudDetails: string
}

export default class NotifyHrMail extends BaseMail {
  from = env.get('MAIL_FROM')
  subject: string

  constructor(private payload: Payload) {
    super()
    this.subject =
      payload.status === 'manual_review'
        ? `[FauxDetect] Manual review required — expense #${payload.expenseId}`
        : `[FauxDetect] New expense submitted — expense #${payload.expenseId}`
  }

  prepare() {
    this.message
      .to(this.payload.recipientEmail)
      .htmlView('emails/notify_hr', {
        expenseId: this.payload.expenseId,
        employeeName: this.payload.employeeName,
        status: this.payload.status,
        fraudDetails: this.payload.fraudDetails,
      })
  }
}
