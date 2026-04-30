import { test } from '@japa/runner'
import mail from '@adonisjs/mail/services/main'
import ExpenseRejectedMail from '#mails/expense_rejected_mail'

const payload = {
  to: 'employee@company.com',
  expenseId: '01ABC456',
  reason: 'duplicate file detected; suspicious words in text',
}

test.group('ExpenseRejectedMail', (group) => {
  group.each.teardown(() => mail.restore())

  test('sends to the correct recipient', async () => {
    const fake = mail.fake()

    await mail.send(new ExpenseRejectedMail(payload))

    fake.mails.assertSent(ExpenseRejectedMail, ({ message }) => {
      return message.hasTo('employee@company.com')
    })
  })

  test('uses correct subject', async () => {
    const fake = mail.fake()

    await mail.send(new ExpenseRejectedMail(payload))

    fake.mails.assertSent(ExpenseRejectedMail, ({ message }) => {
      return message.hasSubject('Your expense submission was rejected')
    })
  })

  test('sends exactly one email per call', async () => {
    const fake = mail.fake()

    await mail.send(new ExpenseRejectedMail(payload))

    fake.mails.assertSentCount(ExpenseRejectedMail, 1)
  })

  test('html includes expense id and rejection reason', async () => {
    const rejectedMail = new ExpenseRejectedMail(payload)
    await rejectedMail.buildWithContents()

    rejectedMail.message.assertHtmlIncludes('#01ABC456')
    rejectedMail.message.assertHtmlIncludes('duplicate file detected')
  })
})
