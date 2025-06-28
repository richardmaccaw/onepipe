import type { Env, TrackSystemEvent, IdentifySystemEvent, PageSystemEvent } from './types'
import type { DestinationPlugin, DestinationPluginInstance } from '@onepipe/core'

interface PluginConfig {
  destinations?: string[];
}

class PluginManager {
  private plugins: DestinationPluginInstance[] | null = null;
  private config: PluginConfig;

  constructor(config: PluginConfig = {}) {
    this.config = config;
  }

  private async discoverInstalledPlugins(): Promise<string[]> {
    const installedPlugins: string[] = [];
    
    // List of potential destination packages to check
    const potentialPlugins = [
      '@onepipe/destination-bigquery',
      '@onepipe/destination-s3',
      '@onepipe/destination-webhook',
      '@onepipe/destination-postgres',
      '@onepipe/destination-snowflake',
      // Add more as they're created
    ];

    for (const pluginName of potentialPlugins) {
      try {
        // Try to dynamically import the plugin to see if it's installed
        await import(pluginName);
        installedPlugins.push(pluginName);
      } catch (error) {
        // Plugin not installed, skip it
        continue;
      }
    }

    return installedPlugins;
  }

  public async initPlugins(env: Env): Promise<DestinationPluginInstance[]> {
    if (this.plugins) {
      return this.plugins;
    }
    
    // If destinations are explicitly configured, use those
    // Otherwise, auto-discover all installed destination packages
    const pluginsToLoad = this.config.destinations || await this.discoverInstalledPlugins();
    
    if (pluginsToLoad.length === 0) {
      console.warn('No destination plugins configured or installed');
      this.plugins = [];
      return this.plugins;
    }

    this.plugins = await Promise.all(
      pluginsToLoad.map(async (pluginName: string) => {
        try {
          const pluginModule = await import(pluginName);
          const plugin: DestinationPlugin = pluginModule.default || pluginModule;
          
          return plugin.setup(env);
        } catch (error) {
          console.error(`Failed to load plugin ${pluginName}:`, error);
          throw new Error(`Plugin "${pluginName}" could not be loaded. Make sure it's installed: pnpm add ${pluginName}`);
        }
      })
    );
    
    console.log(`Loaded ${this.plugins.length} destination plugins: ${pluginsToLoad.join(', ')}`);
    return this.plugins;
  }
}

// Load config with fallback
async function loadConfig(): Promise<PluginConfig> {
  try {
    // Try to import the config file
    const configModule = await import('../../../onepipe.config.json');
    return configModule.default;
  } catch (error) {
    console.warn('No onepipe.config.json found, using auto-discovery mode');
    return {};
  }
}

async function withPlugins<T>(
  action: (plugins: DestinationPluginInstance[]) => Promise<T>,
  env: Env,
  config?: PluginConfig
): Promise<T> {
  const finalConfig = config || await loadConfig();
  const manager = new PluginManager(finalConfig);
  const plugins = await manager.initPlugins(env);
  return action(plugins);
}

export async function triggerTrack(event: TrackSystemEvent, env: Env): Promise<void> {
  return withPlugins(async (plugins) => {
    await Promise.all(
      plugins.map(async (plugin) => {
        if (plugin.track) {
          await plugin.track(event);
        }
      })
    );
  }, env);
}

export async function triggerIdentify(event: IdentifySystemEvent, env: Env): Promise<void> {
  return withPlugins(async (plugins) => {
    await Promise.all(
      plugins.map(async (plugin) => {
        if (plugin.identify) {
          await plugin.identify(event);
        }
      })
    );
  }, env);
}

export async function triggerPage(event: PageSystemEvent, env: Env): Promise<void> {
  return withPlugins(async (plugins) => {
    await Promise.all(
      plugins.map(async (plugin) => {
        if (plugin.page) {
          await plugin.page(event);
        }
      })
    );
  }, env);
}
