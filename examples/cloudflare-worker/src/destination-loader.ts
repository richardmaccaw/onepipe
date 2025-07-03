import type { 
  Env, 
  TrackSystemEvent, 
  IdentifySystemEvent, 
  PageSystemEvent,
  Destination, 
  DestinationInstance 
} from './types'

// Configuration - can be customized by users
// Users can modify onepipe.config.json or this file directly
import defaultConfigJson from '../onepipe.config.json'

const defaultConfig = {
  destinations: defaultConfigJson.destinations as string[]
}

// Destination registry with lazy dynamic imports
// Users can extend this by installing additional destination packages
const DESTINATION_REGISTRY: Record<string, () => Promise<Destination>> = {
  '@onepipe/destination-bigquery': async () => {
    const { destinationBigQuery } = await import('@onepipe/destination-bigquery')
    return destinationBigQuery
  },
  // Add more destinations here as needed
  // '@onepipe/destination-mixpanel': async () => {
  //   const { destinationMixpanel } = await import('@onepipe/destination-mixpanel')
  //   return destinationMixpanel
  // },
}

class DestinationManager {
  private destinations: DestinationInstance[] | null = null
  private config: typeof defaultConfig

  constructor(config: typeof defaultConfig = defaultConfig) {
    this.config = config
  }

  public async initDestinations(env: Env): Promise<DestinationInstance[]> {
    if (this.destinations) {
      return this.destinations
    }
    
    this.destinations = await Promise.all(
      this.config.destinations.map(async (name: string) => {
        const destinationLoader = DESTINATION_REGISTRY[name]
        if (!destinationLoader) {
          throw new Error(`Destination "${name}" not found in registry`)
        }
        const destination = await destinationLoader()
        return destination.setup(env)
      })
    )
    
    return this.destinations
  }
}

async function withDestinations<T>(
  env: Env,
  fn: (destinations: DestinationInstance[]) => Promise<T>,
  manager: DestinationManager
): Promise<T> {
  const destinations = await manager.initDestinations(env)
  return fn(destinations)
}

export function createDestinationTriggers(config: typeof defaultConfig = defaultConfig) {
  const manager = new DestinationManager(config)
  
  return {
    triggerTrack: async (event: TrackSystemEvent, env: Env) =>
      withDestinations(env, async (destinations) => {
        for (const destination of destinations) {
          if (destination.track) {
            await destination.track(event)
          }
        }
      }, manager),
      
    triggerIdentify: async (event: IdentifySystemEvent, env: Env) =>
      withDestinations(env, async (destinations) => {
        for (const destination of destinations) {
          if (destination.identify) {
            await destination.identify(event)
          }
        }
      }, manager),
      
    triggerPage: async (event: PageSystemEvent, env: Env) =>
      withDestinations(env, async (destinations) => {
        for (const destination of destinations) {
          if (destination.page) {
            await destination.page(event)
          }
        }
      }, manager),
  }
}

// Default export with empty configuration
// Users can configure destinations by modifying this or creating their own config
export const { triggerTrack, triggerIdentify, triggerPage } = createDestinationTriggers()