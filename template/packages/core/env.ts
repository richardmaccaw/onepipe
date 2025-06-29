import { QueueMessage } from './types'

export interface Env {
  TOKEN_CACHE: KVNamespace
  QUEUE: Queue<QueueMessage>

  // Setup mode variables
  SETUP_MODE?: string
  SETUP_TOKEN?: string
  
  // OAuth configuration
  GOOGLE_OAUTH_CLIENT_ID?: string
  GOOGLE_OAUTH_CLIENT_SECRET?: string

  [key: string]: any
}