import type { Env, TrackSystemEvent, IdentifySystemEvent, PageSystemEvent } from './types'
import type { Destination, DestinationInstance } from '@onepipe/core'
import defaultConfig from '../onepipe-configuration.json'

// Destination registry with lazy dynamic imports
const DESTINATION_REGISTRY: Record<string, () => Promise<Destination>> = {
  '@onepipe/destination-bigquery': async () => {
    const { destinationBigQuery } = await import('@onepipe/destination-bigquery')
    return destinationBigQuery
  },
}

class DestinationManager {
  private destinations: DestinationInstance[] | null = null;
  private config: any;

  constructor(config: any = defaultConfig) {
    this.config = config;
  }

  public async initDestinations(env: Env): Promise<DestinationInstance[]> {
    if (this.destinations) {
      return this.destinations;
    }
    this.destinations = await Promise.all(
      this.config.destinations.map(async (name: string) => {
        const destinationLoader = DESTINATION_REGISTRY[name];
        if (!destinationLoader) {
          throw new Error(`Destination "${name}" not found in registry`);
        }
        const destination = await destinationLoader();
        return destination.setup(env);
      })
    );
    return this.destinations;
  }
}

async function withDestinations<T>(
  env: Env,
  fn: (destinations: DestinationInstance[]) => Promise<T>,
  manager: DestinationManager
): Promise<T> {
  const destinations = await manager.initDestinations(env);
  return fn(destinations);
}

export function createDestinationTriggers(config: any = defaultConfig) {
  const manager = new DestinationManager(config);
  return {
    triggerTrack: async (event: TrackSystemEvent, env: Env) =>
      withDestinations(env, async (destinations) => {
        for (const destination of destinations) {
          if (destination.track) await destination.track(event);
        }
      }, manager),
    triggerIdentify: async (event: IdentifySystemEvent, env: Env) =>
      withDestinations(env, async (destinations) => {
        for (const destination of destinations) {
          if (destination.identify) await destination.identify(event);
        }
      }, manager),
    triggerPage: async (event: PageSystemEvent, env: Env) =>
      withDestinations(env, async (destinations) => {
        for (const destination of destinations) {
          if (destination.page) await destination.page(event);
        }
      }, manager),
  };
}

export const { triggerTrack, triggerIdentify, triggerPage } = createDestinationTriggers();
