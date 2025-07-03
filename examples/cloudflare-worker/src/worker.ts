import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { zValidator } from '@hono/zod-validator'
import { v4 as uuid } from 'uuid'

import type { 
  Env, 
  TrackEvent, 
  IdentifyEvent, 
  TrackSystemEvent, 
  IdentifySystemEvent, 
  QueueMessage 
} from './types'
import { trackEventSchema, identifyEventSchema, pageEventSchema } from './types'
import { safeConsumeMessage } from './queue-consumer'

const app = new Hono()

// Apply CORS middleware globally
app.use('*', cors({
  origin: '*',
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

app.get('/', (c) => {
  return c.html(`
    <h1>🚀 OnePipe Cloudflare Worker</h1>

    <p>
      This is a <a href="https://developers.cloudflare.com/workers/">Cloudflare Worker</a> 
      that receives Segment-compatible events and processes them through configurable destinations.
    </p>

    <h2>🎯 Getting Started</h2>
    <p>
      To add destinations like BigQuery, run:
      <br>
      <code>npm install @onepipe/destination-bigquery</code>
      <br>
      Then configure your destinations in the destination-loader.ts file.
    </p>

    <h2>🧪 Test Events</h2>
    <button 
      onclick="fetch('/track', { 
        method: 'POST', 
        body: JSON.stringify({ 
          type: 'track', 
          userId: '123', 
          event: 'button_clicked', 
          anonymousId: '000', 
          properties: { button_name: 'test_track' } 
        }),
        headers: { 'Content-Type': 'application/json' }
      }).then(r => r.json()).then(console.log)">
      🎯 Test Track Event
    </button>

    <button 
      onclick="fetch('/identify', { 
        method: 'POST', 
        body: JSON.stringify({ 
          type: 'identify', 
          userId: '123', 
          anonymousId: '000', 
          traits: { email: 'test@example.com', name: 'Test User' } 
        }),
        headers: { 'Content-Type': 'application/json' }
      }).then(r => r.json()).then(console.log)">
      👤 Test Identify Event
    </button>

    <hr />
    <p><small>
      Deploy this worker to your own Cloudflare account and customize it for your needs!
    </small></p>
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

  return c.json({ ok: true, message: 'Track event queued successfully' })
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

  return c.json({ ok: true, message: 'Identify event queued successfully' })
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

  return c.json({ ok: true, message: 'Page event queued successfully' })
})

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
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