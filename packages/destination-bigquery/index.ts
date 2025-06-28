import type { DestinationPlugin, Env } from '@onepipe/core'
import { bigquery_handleIdentify } from './events/identify'
import { bigquery_handleTrack } from './events/track'
import { createBigQueryEnv } from './lib/env'
import { BigQueryEnv } from 'lib/types'

export const destinationBigQuery: DestinationPlugin = {
  name: '@onepipe/destination-bigquery',
  setup(env: Env & BigQueryEnv) {
    const pluginEnv = createBigQueryEnv(env)
    return {
      identify: (event) => bigquery_handleIdentify(event, pluginEnv),
      track: (event) => bigquery_handleTrack(event, pluginEnv),
    }
  },
}

export default destinationBigQuery
