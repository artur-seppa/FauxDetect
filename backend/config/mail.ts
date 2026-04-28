import { defineConfig, transports } from '@adonisjs/mail'
import env from '#start/env'

const mailConfig = defineConfig({
  default: 'smtp',
  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST'),
      port: env.get('SMTP_PORT'),
      ...(env.get('SMTP_USER') && {
        auth: {
          type: 'login',
          user: env.get('SMTP_USER')!,
          pass: env.get('SMTP_PASS')!,
        },
      }),
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
