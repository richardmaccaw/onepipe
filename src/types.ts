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

// Re-export all types from core package
export * from '@onepipe/core'
