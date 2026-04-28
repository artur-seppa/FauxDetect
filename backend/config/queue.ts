import { defineConfig } from '@rlanz/bull-queue'
import env from '#start/env'

export default defineConfig({
  defaultConnection: {
    host: env.get('REDIS_HOST'),
    port: env.get('REDIS_PORT'),
  },
  queue: {},
  worker: {},
  jobs: {},
})
