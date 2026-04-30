import { test } from '@japa/runner'
import mail from '@adonisjs/mail/services/main'
import NotifyHrMail from '#mails/notify_hr_mail'

const pendingPayload = {
  recipientEmail: 'hr@company.com',
  expenseId: '01ABC123',
  employeeName: 'John Doe',
  status: 'pending' as const,
  fraudDetails: 'no fraud signals detected',
}

const manualReviewPayload = {
  ...pendingPayload,
  status: 'manual_review' as const,
  fraudDetails: 'low OCR confidence (65%)',
}

test.group('NotifyHrMail', (group) => {
  group.each.teardown(() => mail.restore())

  test('sends to the correct recipient', async () => {
    const fake = mail.fake()

    await mail.send(new NotifyHrMail(pendingPayload))

    fake.mails.assertSent(NotifyHrMail, ({ message }) => {
      return message.hasTo('hr@company.com')
    })
  })

  test('uses correct subject for pending status', async () => {
    const fake = mail.fake()

    await mail.send(new NotifyHrMail(pendingPayload))

    fake.mails.assertSent(NotifyHrMail, ({ message }) => {
      return message.hasSubject('[FauxDetect] New expense submitted — expense #01ABC123')
    })
  })

  test('uses correct subject for manual_review status', async () => {
    const fake = mail.fake()

    await mail.send(new NotifyHrMail(manualReviewPayload))

    fake.mails.assertSent(NotifyHrMail, ({ message }) => {
      return message.hasSubject('[FauxDetect] Manual review required — expense #01ABC123')
    })
  })

  test('sends exactly one email per call', async () => {
    const fake = mail.fake()

    await mail.send(new NotifyHrMail(pendingPayload))

    fake.mails.assertSentCount(NotifyHrMail, 1)
  })

  test('html includes expense id and employee name', async () => {
    const notifyMail = new NotifyHrMail(pendingPayload)
    await notifyMail.buildWithContents()

    notifyMail.message.assertHtmlIncludes('#01ABC123')
    notifyMail.message.assertHtmlIncludes('John Doe')
  })

  test('html includes fraud details', async () => {
    const notifyMail = new NotifyHrMail(manualReviewPayload)
    await notifyMail.buildWithContents()

    notifyMail.message.assertHtmlIncludes('low OCR confidence (65%)')
  })
})
