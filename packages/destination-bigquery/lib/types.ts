import type { Env } from '@onepipe/core'

export const baseUrl = 'https://bigquery.googleapis.com/bigquery/v2' as const

export const destinationName = 'destination-bigquery'

export interface BigQueryConnectOptions {
  projectId: string
  datasetId: string
  tableId: string
  accessToken: string
}

export type BigQueryEvent = {
  [key: string]: string | number | Date | null | boolean
}

type BigQuerySchemaFieldType = 'STRING' | 'FLOAT' | 'INTEGER' | 'TIMESTAMP' | 'BOOLEAN'

export type BigQuerySchemaField = {
  name: string
  type: BigQuerySchemaFieldType
}

export interface BigQueryInsertResponse {
  kind: string
  insertErrors?: {
    index: number
    errors: {
      reason: string
      location: string
      debugInfo: string
      message: string
    }[]
  }[]
}

export interface BigQueryEnv extends Env {
  BIGQUERY_PROJECT_ID: string
  BIGQUERY_DATASET_ID: string
  GOOGLE_CLOUD_CREDENTIALS: string
} 