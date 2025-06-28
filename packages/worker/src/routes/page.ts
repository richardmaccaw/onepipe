import { withZod } from 'cloudflare-basics/middleware/zod-validation'
import { v4 as uuid } from 'uuid'
import type { Env } from '../types'
import {
  PageEvent,
  TrackSystemEvent,
  pageEventSchema,
} from '@onepipe/core'

import { json } from '@onepipe/core'

export const RoutePage = withZod<Env, PageEvent>(pageEventSchema, async ({ data, env }) => {
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

  return json({ ok: true })
})
