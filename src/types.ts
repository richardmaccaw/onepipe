import { Env as BaseEnv } from '@onepipe/core'

export interface Env extends BaseEnv {
  BIGQUERY_PROJECT_ID: string
  BIGQUERY_DATASET_ID: string
  GOOGLE_CLOUD_CREDENTIALS: string
}

// Re-export createBigQueryEnv from the destination package for convenience

// Re-export all types from core package
export * from '@onepipe/core'

