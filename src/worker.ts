import { Router } from 'cloudflare-basics'
import type { Env } from '@onepipe/core'
import { RouteTrack } from './routes/track'
import { RouteIndex } from './routes'
import { CorsRoute } from './routes/cors'
import { RouteIdentify } from './routes/identify'
import { RoutePage } from './routes/page'
import { QueueMessage } from './types'
import { safeConsumeMessage } from './queue'

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const router = new Router<Env>()

    router.get('/', RouteIndex)

    router.post('/t', RouteTrack)
    router.post('/track', RouteTrack)

    router.post('/i', RouteIdentify)
    router.post('/identify', RouteIdentify)

    router.post('/p', RoutePage)
    router.post('/page', RoutePage)

    const handled = await router.handle(request, env, ctx)

    if (handled) {
      return handled
    }

    if (request.method === 'OPTIONS') {
      return CorsRoute()
    }

    return new Response('Not Found', { status: 404 })
  },

  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      await safeConsumeMessage(message, env)
    }
  },
}
