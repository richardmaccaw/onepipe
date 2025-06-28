import type { Env, TrackSystemEvent, IdentifySystemEvent, PageSystemEvent } from './types'
import type { DestinationPlugin, DestinationPluginInstance } from '@onepipe/core'
import defaultConfig from '../../../onepipe.config.json'

// Plugin registry with lazy dynamic imports
const PLUGIN_REGISTRY: Record<string, () => Promise<DestinationPlugin>> = {
  '@onepipe/destination-bigquery': async () => {
    const { destinationBigQuery } = await import('@onepipe/destination-bigquery')
    return destinationBigQuery
  },
}

class PluginManager {
  private plugins: DestinationPluginInstance[] | null = null;
  private config: any;

  constructor(config: any = defaultConfig) {
    this.config = config;
  }

  public async initPlugins(env: Env): Promise<DestinationPluginInstance[]> {
    if (this.plugins) {
      return this.plugins;
    }
    this.plugins = await Promise.all(
      this.config.destinations.map(async (name: string) => {
        const pluginLoader = PLUGIN_REGISTRY[name];
        if (!pluginLoader) {
          throw new Error(`Plugin "${name}" not found in registry`);
        }
        const plugin = await pluginLoader();
        return plugin.setup(env);
      })
    );
    return this.plugins;
  }
}

async function withPlugins<T>(
  env: Env,
  fn: (plugins: DestinationPluginInstance[]) => Promise<T>,
  manager: PluginManager
): Promise<T> {
  const plugins = await manager.initPlugins(env);
  return fn(plugins);
}

export function createPluginTriggers(config: any = defaultConfig) {
  const manager = new PluginManager(config);
  return {
    triggerTrack: async (event: TrackSystemEvent, env: Env) =>
      withPlugins(env, async (plugins) => {
        for (const plugin of plugins) {
          if (plugin.track) await plugin.track(event);
        }
      }, manager),
    triggerIdentify: async (event: IdentifySystemEvent, env: Env) =>
      withPlugins(env, async (plugins) => {
        for (const plugin of plugins) {
          if (plugin.identify) await plugin.identify(event);
        }
      }, manager),
    triggerPage: async (event: PageSystemEvent, env: Env) =>
      withPlugins(env, async (plugins) => {
        for (const plugin of plugins) {
          if (plugin.page) await plugin.page(event);
        }
      }, manager),
  };
}

export const { triggerTrack, triggerIdentify, triggerPage } = createPluginTriggers();
