export const baseUrl = 'https://bigquery.googleapis.com/bigquery/v2' as const

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
