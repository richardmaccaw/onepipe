import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { v4 as uuid } from 'uuid'
import type { Env } from '../types'
import { trackEventSchema, identifyEventSchema, pageEventSchema } from '@onepipe/core'
import type { TrackSystemEvent, IdentifySystemEvent } from '@onepipe/core'

const eventsApp = new Hono<{ Bindings: Env }>()
  .on('POST', ['/track', '/t'], zValidator('json', trackEventSchema), async (c) => {
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
  .on('POST', ['/identify', '/i'], zValidator('json', identifyEventSchema), async (c) => {
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
  .on('POST', ['/page', '/p'], zValidator('json', pageEventSchema), async (c) => {
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

export default eventsApp