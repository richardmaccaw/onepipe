import { withZod } from 'cloudflare-basics/middleware/zod-validation'
import { v4 as uuid } from 'uuid'
import { Env } from '../env'
import { json } from '../lib/response'
import { IdentifyEvent, IdentifySystemEvent, identifyEventSchema } from '../types'

export const RouteIdentify = withZod<Env, IdentifyEvent>(identifyEventSchema, async ({ data, env }) => {
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

  return json({ ok: true })
})
