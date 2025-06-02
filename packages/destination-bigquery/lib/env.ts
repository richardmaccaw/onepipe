import type { Cache } from '@onepipe/core'

export interface BigQueryEnv {
  tokenCache: Cache
  BIGQUERY_PROJECT_ID: string
  BIGQUERY_DATASET_ID: string
  GOOGLE_CLOUD_CREDENTIALS: string
} 