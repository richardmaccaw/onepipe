export interface Env {
  GOOGLE_TOKENS: KVNamespace
  QUEUE: Queue<any>  // Using any for now, will be typed by the consuming app
  BIGQUERY_PROJECT_ID: string
  BIGQUERY_DATASET_ID: string
  GOOGLE_CLOUD_CREDENTIALS: string
} 