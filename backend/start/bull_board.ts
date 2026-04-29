import express from 'express'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import queue from '@rlanz/bull-queue/services/main'

const BULL_BOARD_PORT = Number(process.env.BULL_BOARD_PORT ?? 9999)
const BASE_PATH = '/queues'

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath(BASE_PATH)

createBullBoard({
  queues: [
    new BullMQAdapter(queue.getOrSet('expenses')),
    new BullMQAdapter(queue.getOrSet('emails')),
  ],
  serverAdapter,
})

const server = express()
server.use(BASE_PATH, serverAdapter.getRouter())
server.listen(BULL_BOARD_PORT, () => {
  console.log(`Bull Board → http://localhost:${BULL_BOARD_PORT}${BASE_PATH}`)
})
