import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { zValidator } from '@hono/zod-validator'
import { v4 as uuid } from 'uuid'
import type { Env } from './types'
import { trackEventSchema, identifyEventSchema, pageEventSchema } from '@onepipe/core'
import type { TrackEvent, IdentifyEvent, PageEvent, TrackSystemEvent, IdentifySystemEvent, QueueMessage } from '@onepipe/core'
import { safeConsumeMessage } from './queue/consumer'

const app = new Hono()

// Apply CORS middleware globally
app.use('*', cors({
  origin: '*',
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))


app.get('/', (c) => {
  return c.html(`
    <h1>onepipe</h1>

    <p>
      This is a <a href="https://developers.cloudflare.com/workers/">Cloudflare Worker</a> that receives Segment events and sends them to <a href="https://cloud.google.com/bigquery">BigQuery</a>.
    </p>

    <hr />

    <button 
      onclick="fetch('/track', { method: 'POST', 
        body: JSON.stringify({ type: 'track', userId: '123', event: 'my_test_event', anonymousId: '000', properties: { my_property: 'test' } }),
        headers:  { 'Content-Type': 'application/json' }
      })">
      Trigger track event
    </button>
  `)
})


app.post('/track', zValidator('json', trackEventSchema), async (c) => {
  const data = c.req.valid('json')
  const env = c.env as Env
  

  const timestamp = new Date()

  const event: TrackSystemEvent = {
    ...data,
    id: uuid(),
    timestamp: data.timestamp || timestamp,
    loadedAt: timestamp,
    receivedAt: timestamp,
    sentAt: timestamp,
  }

  await env.QUEUE.send({
    type: 'track',
    event,
  })

  return c.json({ ok: true })
})

app.post('/identify', zValidator('json', identifyEventSchema), async (c) => {
  const data = c.req.valid('json')
  const env = c.env as Env
  

  const timestamp = new Date()

  const event: IdentifySystemEvent = {
    ...data,
    id: uuid(),
    timestamp: data.timestamp || timestamp,
    loadedAt: timestamp,
    receivedAt: timestamp,
    sentAt: timestamp,
  }

  await env.QUEUE.send({
    type: 'identify',
    event,
  })

  return c.json({ ok: true })
})

app.post('/page', zValidator('json', pageEventSchema), async (c) => {
  const data = c.req.valid('json')
  const env = c.env as Env
  

  const timestamp = new Date()

  const event: TrackSystemEvent = {
    ...data,
    type: 'track',
    event: 'page',
    id: uuid(),
    timestamp: data.timestamp || timestamp,
    loadedAt: timestamp,
    receivedAt: timestamp,
    sentAt: timestamp,
    properties: {
      ...data.properties,
      name: data.name,
      category: data.category,
    },
  }

  await env.QUEUE.send({
    type: 'track',
    event,
  })

  return c.json({ ok: true })
})

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
