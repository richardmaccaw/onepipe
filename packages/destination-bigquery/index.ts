import type { Destination, DestinationInstance, Env, IdentifySystemEvent, TrackSystemEvent } from '@onepipe/core'
import { bigquery_handleIdentify } from './events/identify'
import { bigquery_handleTrack } from './events/track'
import { bigQueryEnv } from './lib/env'

/**
 * Cloudflare Worker Destination for BigQuery.
 * Handles identify and track events.
 */
export const destinationBigQuery: Destination = {
  name: '@onepipe/destination-bigquery',
  async setup(env: Env): Promise<DestinationInstance> {
    const pluginEnv = await bigQueryEnv(env)
    return {
      identify: (event: IdentifySystemEvent) => bigquery_handleIdentify(event, pluginEnv),
      track: (event: TrackSystemEvent) => bigquery_handleTrack(event, pluginEnv),
    }
  },
}

export default destinationBigQuery
