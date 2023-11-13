import { withZod } from 'cloudflare-basics/middleware/zod-validation'
import { v4 as uuid } from 'uuid'
import { Env } from '../env'
import { json } from '../lib/response'
import { TrackEvent, TrackSystemEvent, trackEventSchema } from '../types'

export const RouteTrack = withZod<Env, TrackEvent>(trackEventSchema, async ({ data, env }) => {
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

  return json({ ok: true })
})
