import { z } from 'zod'

// === Environment Interface ===
export interface QueueMessage {
  type: 'identify' | 'track'
  event: IdentifySystemEvent | TrackSystemEvent
}

export interface Env {
  TOKEN_CACHE: KVNamespace
  QUEUE: Queue<QueueMessage>
  [key: string]: any
}

// === Schema Definitions ===
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

// === System Event Types ===
export interface SystemEventDecoration {
  id: string
  loadedAt: Date
  receivedAt: Date
  sentAt: Date
}

export type TrackSystemEvent = TrackEvent & SystemEventDecoration
export type IdentifySystemEvent = IdentifyEvent & SystemEventDecoration
export type PageSystemEvent = PageEvent & SystemEventDecoration

// === Queue Message Types ===
export interface IdentifyQueueMessage {
  type: 'identify'
  event: IdentifySystemEvent
}

export interface TrackQueueMessage {
  type: 'track'
  event: TrackSystemEvent
}

// === Destination Interface ===
export interface DestinationInstance {
  identify?(event: IdentifySystemEvent): Promise<void>
  track?(event: TrackSystemEvent): Promise<void>
  page?(event: PageSystemEvent): Promise<void>
}

export interface Destination {
  name: string
  setup(env: Env): DestinationInstance
}

// === Cache Interface ===
export interface Cache {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

/**
 * Creates a namespaced cache that prefixes all keys with the given namespace.
 * This allows multiple destinations to share a single KV store without key conflicts.
 */
export function createNamespacedCache(
  kv: KVNamespace, 
  namespace: string
): Cache {
  return {
    get: (key) => kv.get(`${namespace}:${key}`),
    put: (key, value, options) => kv.put(`${namespace}:${key}`, value, options),
    delete: (key) => kv.delete(`${namespace}:${key}`)
  }
}

// === Utility Functions ===
export function json(response: any) {
  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function assertString(input: any): asserts input is string {
  if (typeof input !== 'string') {
    throw new Error('Input is not a string')
  }
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}