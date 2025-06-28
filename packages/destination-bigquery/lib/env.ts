import type { Cache, Env } from '@onepipe/core'
import { createNamespacedCache } from '@onepipe/core'
import type { BigQueryEnv } from './types'

export type { BigQueryEnv }


export function createBigQueryEnv(
  env: Env & BigQueryEnv
): BigQueryEnv {
  if (!env.BIGQUERY_PROJECT_ID) {
    throw new Error('Missing BIGQUERY_PROJECT_ID environment variable. Please set in .env file or wrangler.toml.');
  }
  
  if (!env.BIGQUERY_DATASET_ID) {
    throw new Error('Missing BIGQUERY_DATASET_ID environment variable. Please set in .env file or wrangler.toml.');
  }
  
  if (!env.GOOGLE_CLOUD_CREDENTIALS) {
    throw new Error('Missing GOOGLE_CLOUD_CREDENTIALS. Please set using: wrangler secret put GOOGLE_CLOUD_CREDENTIALS');
  }

  return {
    tokenCache: createNamespacedCache(env.TOKEN_CACHE, 'google'),
    BIGQUERY_PROJECT_ID: env.BIGQUERY_PROJECT_ID,
    BIGQUERY_DATASET_ID: env.BIGQUERY_DATASET_ID,
    GOOGLE_CLOUD_CREDENTIALS: env.GOOGLE_CLOUD_CREDENTIALS,
  }
}
