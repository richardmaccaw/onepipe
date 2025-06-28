import { insertEvents } from '../lib/table'
import type { BigQueryEnv } from '../lib/env'
import type { TrackSystemEvent } from '@onepipe/core'
import { getCachedAccessTokenForEnv } from '../lib/google'
import { normalizeEvent, normalizeTableId, withCatchEnsureTableSchema } from './helpers'
import type { BigQueryConnectOptions } from '../lib/types'

export async function bigquery_handleTrack(event: TrackSystemEvent, env: BigQueryEnv) {
  const tableId = normalizeTableId(event.event)
  const accessToken = await getCachedAccessTokenForEnv(env)
  const options: BigQueryConnectOptions = {
    accessToken,
    projectId: env.BIGQUERY_PROJECT_ID,
    datasetId: env.BIGQUERY_DATASET_ID,
    tableId,
  }

  const normalizedEvent = normalizeEvent(event)

  const trackEvent = {
    ...normalizedEvent,
    event: 'track',
  }

  await withCatchEnsureTableSchema(
    () => {
      return insertEvents([normalizedEvent, trackEvent], options)
    },
    normalizedEvent,
    options
  )
} 