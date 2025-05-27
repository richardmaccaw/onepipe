import { QueueMessage } from '../../src/types'

export interface Env {
  GOOGLE_TOKENS: KVNamespace
  QUEUE: Queue<QueueMessage>
  BIGQUERY_PROJECT_ID: string
  BIGQUERY_DATASET_ID: string
  GOOGLE_CLOUD_CREDENTIALS: string
} 