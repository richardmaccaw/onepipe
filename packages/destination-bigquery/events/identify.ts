import type { BigQueryEnv } from '../lib/env'
import { IdentifySystemEvent } from '@onepipe/core'
import { getCachedAccessTokenForEnv } from '../lib/google'
import { normalizeEvent } from './helpers'
import { insertEvents } from '../lib/table'

export async function bigquery_handleIdentify(event: IdentifySystemEvent, env: BigQueryEnv) {
  const tableId = 'identifies'
  const accessToken = await getCachedAccessTokenForEnv(env)

  return insertEvents([normalizeEvent(event)], {
    accessToken,
    projectId: env.BIGQUERY_PROJECT_ID,
    datasetId: env.BIGQUERY_DATASET_ID,
    tableId,
  })
} 