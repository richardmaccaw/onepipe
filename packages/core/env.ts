import { QueueMessage } from './types'

export interface Env {
  KV_BINDING: KVNamespace
  QUEUE: Queue<QueueMessage>
}