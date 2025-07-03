import type { Env } from '@onepipe/core'
import { destinationName } from './types'
import type { BigQueryEnv } from './types'

/**
 * Loads and validates BigQuery environment variables from KV and secrets.
 * Throws if any required variable is missing.
 */
export async function bigQueryEnv(env: Env): Promise<BigQueryEnv> {
  const result = await env.KV_BINDING.getWithMetadata(destinationName)
  const { BIGQUERY_PROJECT_ID, BIGQUERY_DATASET_ID } = result.metadata
  const { GOOGLE_CLOUD_CREDENTIALS } = env

  if (!BIGQUERY_PROJECT_ID) {
    throw new Error('Missing BIGQUERY_PROJECT_ID environment variable.')
  }
  if (!BIGQUERY_DATASET_ID) {
    throw new Error('Missing BIGQUERY_DATASET_ID environment variable.')
  }
  if (!GOOGLE_CLOUD_CREDENTIALS) {
    throw new Error('Missing GOOGLE_CLOUD_CREDENTIALS. Please set using: wrangler secret put GOOGLE_CLOUD_CREDENTIALS')
  }

  return {
    ...env,
    BIGQUERY_PROJECT_ID,
    BIGQUERY_DATASET_ID,
    GOOGLE_CLOUD_CREDENTIALS,
  }
}

export type { BigQueryEnv } from './types'
