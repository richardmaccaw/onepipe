import type { Env, TrackSystemEvent, IdentifySystemEvent, PageSystemEvent } from './types'
import type { DestinationPlugin, DestinationPluginInstance } from '@onepipe/core'
import config from '../onepipe.config.json'

class PluginManager {
  private static instance: PluginManager;
  private plugins: DestinationPluginInstance[] | null = null;

  private constructor() {}

  public static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  public async initPlugins(env: Env): Promise<DestinationPluginInstance[]> {
    if (this.plugins) {
      return this.plugins;
    }

    this.plugins = await Promise.all(
      config.destinations.map(async (name: string) => {
        const mod = await import(name);
        const plugin = mod.default as DestinationPlugin;
        return plugin.setup(env);
      })
    );

    return this.plugins;
  }
}

async function withPlugins<T>(env: Env, fn: (plugins: DestinationPluginInstance[]) => Promise<T>): Promise<T> {
  const pluginManager = PluginManager.getInstance();
  const plugins = await pluginManager.initPlugins(env);
  return fn(plugins);
}

export async function triggerTrack(event: TrackSystemEvent, env: Env) {
  return withPlugins(env, async (plugins) => {
    for (const plugin of plugins) {
      if (plugin.track) {
        await plugin.track(event)
      }
    }
  })
}

export async function triggerIdentify(event: IdentifySystemEvent, env: Env) {
  return withPlugins(env, async (plugins) => {
    for (const plugin of plugins) {
      if (plugin.identify) {
        await plugin.identify(event)
      }
    }
  })
}

export async function triggerPage(event: PageSystemEvent, env: Env) {
  return withPlugins(env, async (plugins) => {
    for (const plugin of plugins) {
      if (plugin.page) {
        await plugin.page(event)
      }
    }
  })
}
