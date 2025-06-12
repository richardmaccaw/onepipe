import type { Env, TrackSystemEvent, IdentifySystemEvent, PageSystemEvent } from './types'
import type { DestinationPlugin, DestinationPluginInstance } from '@onepipe/core'
import config from '../onepipe.config.json'

let loaded: DestinationPluginInstance[] | null = null

async function initPlugins(env: Env): Promise<DestinationPluginInstance[]> {
  if (loaded) {
    return loaded
  }

  const plugins = await Promise.all(
    config.destinations.map(async (name: string) => {
      const mod = await import(name)
      const plugin = mod.default as DestinationPlugin
      return plugin.setup(env)
    })
  )

  loaded = plugins
  return plugins
}

async function withPlugins<T>(env: Env, fn: (plugins: DestinationPluginInstance[]) => Promise<T>): Promise<T> {
  const plugins = await initPlugins(env)
  return fn(plugins)
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
