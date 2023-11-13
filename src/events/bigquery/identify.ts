import { Env } from '../../env'
import { IdentifySystemEvent } from '../../types'
import { getCachedAccessTokenForEnv } from '../../lib/clients/google'
import { normalizeEvent } from './helpers'
import { insertEvents } from '../../lib/clients/bigquery'

export async function bigquery_handleIdentify(event: IdentifySystemEvent, env: Env) {
  const tableId = 'identifies'
  const accessToken = await getCachedAccessTokenForEnv(env)

  return insertEvents([normalizeEvent(event)], {
    accessToken,
    projectId: env.BIGQUERY_PROJECT_ID,
    datasetId: env.BIGQUERY_DATASET_ID,
    tableId,
  })
}
