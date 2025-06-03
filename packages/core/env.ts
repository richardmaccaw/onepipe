import { QueueMessage } from './types'

export interface Env {
  TOKEN_CACHE: KVNamespace
  QUEUE: Queue<QueueMessage>
}