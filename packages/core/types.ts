import { z } from 'zod'
import type { Env } from './env'

export const contextSchema = z.object({
  library: z
    .object({
      name: z.string(),
      version: z.string(),
    })
    .optional(),
  page: z
    .object({
      path: z.string(),
      referrer: z.string(),
      search: z.string(),
      title: z.string(),
      url: z.string(),
    })
    .optional(),
  userAgent: z.string().optional(),
  ip: z.string(),
})

const baseEventSchema = z.object({
  anonymousId: z.string(),
  context: contextSchema.optional(),
  timestamp: z.coerce.date().optional(),
  userId: z.string().optional(),
  channel: z.string().optional(),
  messageId: z.string().optional(),
  properties: z.record(z.any()).optional(),
})

export const trackEventSchema = baseEventSchema.merge(
  z.object({
    event: z.string(),
    type: z.enum(['track']).default('track'),
  })
)

export type TrackEvent = z.infer<typeof trackEventSchema>

export const pageEventSchema = baseEventSchema.merge(
  z.object({
    type: z.enum(['page']),
    name: z.string().optional(),
    category: z.string().optional(),
  })
)

export type PageEvent = z.infer<typeof pageEventSchema>

export const identifyEventSchema = baseEventSchema.merge(
  z.object({
    type: z.enum(['identify']),
    traits: z.record(z.any()).optional(),
  })
)

export type IdentifyEvent = z.infer<typeof identifyEventSchema>

export interface SystemEventDecoration {
  id: string
  loadedAt: Date
  receivedAt: Date
  sentAt: Date
}

export type TrackSystemEvent = TrackEvent & SystemEventDecoration
export type IdentifySystemEvent = IdentifyEvent & SystemEventDecoration
export type PageSystemEvent = PageEvent & SystemEventDecoration

export interface IdentifyQueueMessage {
  type: 'identify'
  event: IdentifySystemEvent
}

export interface TrackQueueMessage {
  type: 'track'
  event: TrackSystemEvent
}

export type QueueMessage = IdentifyQueueMessage | TrackQueueMessage

export interface DestinationPluginInstance {
  identify?(event: IdentifySystemEvent): Promise<void>
  track?(event: TrackSystemEvent): Promise<void>
  page?(event: PageSystemEvent): Promise<void>
}

export interface DestinationPlugin {
  name: string
  setup(env: Env, config?: Record<string, any>): DestinationPluginInstance
}
