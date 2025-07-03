import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from './types'
import type { QueueMessage } from '@onepipe/core'
import { safeConsumeMessage } from './queue/consumer'
import indexApp from './routes/index'
import eventsApp from './routes/events'

const app = new Hono()

// Apply CORS middleware globally
app.use('*', cors({
  origin: '*',
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))


// Mount route modules
app.route('/', indexApp)
app.route('/', eventsApp)

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx)
  },

  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      await safeConsumeMessage(message, env)
    }
  },
}
