import type { Cache, Env } from '@onepipe/core'
import { createNamespacedCache } from '@onepipe/core'

export interface BigQueryEnv {
  tokenCache: Cache
  BIGQUERY_PROJECT_ID: string
  BIGQUERY_DATASET_ID: string
  GOOGLE_CLOUD_CREDENTIALS: string
}

function resolveConfigValue(configValue: string | undefined, envValue: string | undefined): string {
  // Direct config value takes priority
  if (configValue) {
    return configValue;
  }
  
  // Fallback to environment
  if (envValue) {
    return envValue;
  }
  
  throw new Error(`Missing required environment variable. Please set in wrangler.toml or use wrangler secret put.`);
}

export function createBigQueryEnv(
  env: Env & {
    BIGQUERY_PROJECT_ID: string
    BIGQUERY_DATASET_ID: string
    GOOGLE_CLOUD_CREDENTIALS: string
  },
  config: Record<string, any> = {}
): BigQueryEnv {
  return {
    tokenCache: createNamespacedCache(env.TOKEN_CACHE, 'google'),
    BIGQUERY_PROJECT_ID: resolveConfigValue(config.projectId, env.BIGQUERY_PROJECT_ID),
    BIGQUERY_DATASET_ID: resolveConfigValue(config.datasetId, env.BIGQUERY_DATASET_ID),
    GOOGLE_CLOUD_CREDENTIALS: resolveConfigValue(config.credentials, env.GOOGLE_CLOUD_CREDENTIALS),
  }
}
