import { BigQueryEvent, BigQueryConnectOptions, BigQuerySchemaField, baseUrl } from './types'

export async function ensureTableAndSchema(event: BigQueryEvent, options: BigQueryConnectOptions) {
  const schema = deriveSchema(event)

  const tableExists = await checkTableExists(options)

  if (tableExists) {
    await updateTableSchema(schema, options)
  } else {
    await createTable(schema, options)
  }
}

export function deriveSchema(event: BigQueryEvent): BigQuerySchemaField[] {
  return Object.keys(event).map((key) => ({
    name: key,
    type: deriveColumnType(event[key]),
  }))
}

async function checkTableExists(options: BigQueryConnectOptions): Promise<boolean> {
  const url = `${baseUrl}/projects/${options.projectId}/datasets/${options.datasetId}/tables/${options.tableId}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to check if table exists: ${await response.text()}`)
  }

  return response.ok
}

async function createTable(schema: BigQuerySchemaField[], options: BigQueryConnectOptions): Promise<void> {
  const url = `${baseUrl}/projects/${options.projectId}/datasets/${options.datasetId}/tables`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tableReference: {
        projectId: options.projectId,
        datasetId: options.datasetId,
        tableId: options.tableId,
      },
      schema: { fields: schema },
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to create table: ${await response.text()}`)
  }
}

async function updateTableSchema(schema: BigQuerySchemaField[], options: BigQueryConnectOptions): Promise<void> {
  const url = `${baseUrl}/projects/${options.projectId}/datasets/${options.datasetId}/tables/${options.tableId}`

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      schema: { fields: schema },
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to update table schema: ${await response.text()}`)
  }
}

// Private

function deriveColumnType(value: any): 'STRING' | 'FLOAT' | 'INTEGER' | 'TIMESTAMP' | 'BOOLEAN' {
  if (typeof value === 'string') {
    return 'STRING'
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'INTEGER' : 'FLOAT'
  }

  if (value instanceof Date) {
    return 'TIMESTAMP'
  }

  if (typeof value === 'boolean') {
    return 'BOOLEAN'
  }

  return 'STRING'
}
