import { z } from 'zod'
import { Env as BaseEnv, createNamespacedCache } from '@onepipe/core'
import { BigQueryEnv } from '@onepipe/destination-bigquery'

export interface Env extends BaseEnv {
  // BigQuery-specific environment variables
  BIGQUERY_PROJECT_ID: string
  BIGQUERY_DATASET_ID: string
  GOOGLE_CLOUD_CREDENTIALS: string
}

/**
 * Creates a BigQueryEnv from the global Env, providing a namespaced cache
 * for Google tokens to avoid conflicts with other destination packages.
 */
export function createBigQueryEnv(env: Env): BigQueryEnv {
  return {
    tokenCache: createNamespacedCache(env.TOKEN_CACHE, 'google'),
    BIGQUERY_PROJECT_ID: env.BIGQUERY_PROJECT_ID,
    BIGQUERY_DATASET_ID: env.BIGQUERY_DATASET_ID,
    GOOGLE_CLOUD_CREDENTIALS: env.GOOGLE_CLOUD_CREDENTIALS,
  }
}

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

// https://segment.com/docs/connections/spec/track/
export const trackEventSchema = baseEventSchema.merge(
  z.object({
    event: z.string(),
    type: z.enum(['track']).default('track'),
  })
)

export type TrackEvent = z.infer<typeof trackEventSchema>

// https://segment.com/docs/connections/spec/page/
export const pageEventSchema = baseEventSchema.merge(
  z.object({
    type: z.enum(['page']),
    name: z.string().optional(),
    category: z.string().optional(),
  })
)

export type PageEvent = z.infer<typeof pageEventSchema>

// https://segment.com/docs/connections/spec/identify/
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

export * from '../packages/core/types'
