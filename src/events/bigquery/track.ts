import snakeCase from 'lodash/snakeCase'
import { insertEvents } from '../../lib/clients/bigquery'
import { Env } from '../../env'
import { TrackSystemEvent } from '../../types'
import { getCachedAccessTokenForEnv } from '../../lib/clients/google'
import { normalizeEvent, normalizeTableId, withCatchEnsureTableSchema } from './helpers'
import { BigQueryConnectOptions } from '../../lib/clients/bigquery/types'

export async function bigquery_handleTrack(event: TrackSystemEvent, env: Env) {
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
