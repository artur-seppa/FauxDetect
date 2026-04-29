import { defineConfig } from '@rlanz/bull-queue'
import env from '#start/env'

export default defineConfig({
  defaultConnection: {
    host: env.get('REDIS_HOST'),
    port: env.get('REDIS_PORT'),
  },
  queueNames: ['expenses', 'emails'],
  queue: {},
  worker: {
    concurrency: 5,
  },
  jobs: {
    attempts: 3,
    removeOnComplete: 100,
    removeOnFail: 100,
  },
})
