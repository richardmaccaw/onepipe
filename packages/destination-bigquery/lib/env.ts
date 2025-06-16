import type { Cache, Env } from '@onepipe/core'
import { createNamespacedCache } from '@onepipe/core'

export interface BigQueryEnv {
  tokenCache: Cache
  BIGQUERY_PROJECT_ID: string
  BIGQUERY_DATASET_ID: string
  GOOGLE_CLOUD_CREDENTIALS: string
}

export function createBigQueryEnv(env: Env & {
  BIGQUERY_PROJECT_ID: string
  BIGQUERY_DATASET_ID: string
  GOOGLE_CLOUD_CREDENTIALS: string
}): BigQueryEnv {
  return {
    tokenCache: createNamespacedCache(env.TOKEN_CACHE, 'google'),
    BIGQUERY_PROJECT_ID: env.BIGQUERY_PROJECT_ID,
    BIGQUERY_DATASET_ID: env.BIGQUERY_DATASET_ID,
    GOOGLE_CLOUD_CREDENTIALS: env.GOOGLE_CLOUD_CREDENTIALS,
  }
}
