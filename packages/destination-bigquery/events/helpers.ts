import mapKeys from 'lodash/mapKeys'
import omit from 'lodash/omit'
import snakeCase from 'lodash/snakeCase'
import { ensureTableAndSchema } from '../lib/schema'
import { BigQueryConnectOptions, BigQueryEvent } from '../lib/types'
import { sleep } from '@onepipe/core'

function safeEnsureTableAndSchema(event: BigQueryEvent, options: BigQueryConnectOptions) {
  try {
    return ensureTableAndSchema(event, options)
  } catch (error: any) {
    console.error(`Failed to ensure table and schema: ${error.message}`)
  }
}

// If the is an error, call ensureTableAndSchema so the next request will succeed
export async function withCatchEnsureTableSchema(callback: () => Promise<any>, event: BigQueryEvent, options: BigQueryConnectOptions) {
  try {
    return await callback()
  } catch (error: any) {
    // If the table or field doesn't exist, create it.
    if (/not found|no such field|does not match/i.test(error.message)) {
      console.log('Creating table and schema...')
      await safeEnsureTableAndSchema(event, options)
      // Wait 5 seconds to ensure the table and schema are created
      // before the event is re-enqueued
      await sleep(5000)
    }
    throw error
  }
}

export function normalizeEvent(event: Record<string, any>): BigQueryEvent {
  // 1. Deep flatten the event
  // 2. Turn camelcase keys into underscore
  const eventNormalized = snakeCaseKeys(flattenRecord(event))
  const eventSansCustom = omit(eventNormalized, 'properties', 'traits')

  // Ensure the properties and traits are top level
  return {
    ...eventNormalized.properties,
    ...eventNormalized.traits,
    ...eventSansCustom,
  }
}

// Rename certain tables to match the Segment schema
// https://segment-docs.netlify.app/docs/connections/storage/warehouses/schema/
const tableAliases: Record<string, string> = {
  page: 'pages',
  screen: 'screens',
  group: 'groups',
  identify: 'identifies',
  track: 'tracks',
  account: 'accounts',
  alias: 'aliases',
}

export function normalizeTableId(eventName: string) {
  const tableId = snakeCase(eventName)

  return tableAliases[tableId] || tableId
}

function snakeCaseKeys(record: Record<string, any>) {
  return mapKeys(record, (_value, key) => snakeCase(key))
}

// Deep flattens record, and uses _ to separate nested keys
function flattenRecord(record: Record<string, any>, path: string[] = []): Record<string, any> {
  return Object.entries(record).reduce((acc, [key, value]) => {
    const newPath = [...path, key]
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return { ...acc, ...flattenRecord(value, newPath) }
    } else {
      const newKey = newPath.join('_')
      return { ...acc, [newKey]: value }
    }
  }, {})
} 