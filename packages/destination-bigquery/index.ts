export * from './lib/schema'
export * from './lib/table'
export * from './lib/types'
export * from './lib/env'
export * from './events/identify'
export * from './events/track'
export * from './events/helpers'

import type { DestinationPlugin } from '@onepipe/core'
import { bigquery_handleIdentify } from './events/identify'
import { bigquery_handleTrack } from './events/track'
import { createBigQueryEnv } from './lib/env'

export const destinationBigQuery: DestinationPlugin = {
  name: '@onepipe/destination-bigquery',
  setup(env) {
    const pluginEnv = createBigQueryEnv(env as any)
    return {
      identify: (event) => bigquery_handleIdentify(event, pluginEnv),
      track: (event) => bigquery_handleTrack(event, pluginEnv),
    }
  },
}

export default destinationBigQuery
