import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

export async function checkWranglerInstalled() {
  try {
    const version = execSync('wrangler --version', { encoding: 'utf8' }).trim();
    return {
      installed: true,
      version: version
    };
  } catch (error) {
    return {
      installed: false,
      version: null
    };
  }
}

export function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    return {
      success: true,
      output: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout ? error.stdout.toString() : ''
    };
  }
}

export async function getWranglerConfig() {
  try {
    // Check for wrangler.jsonc
    if (!existsSync('wrangler.jsonc')) {
      return { exists: false };
    }

    // Read and parse wrangler.jsonc (handle JSONC comments)
    const configContent = readFileSync('wrangler.jsonc', 'utf8');
    
    // Remove single-line comments
    const cleanedContent = configContent
      .split('\n')
      .map(line => {
        const commentIndex = line.indexOf('//');
        if (commentIndex !== -1) {
          return line.substring(0, commentIndex);
        }
        return line;
      })
      .join('\n')
      // Remove multi-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '');

    try {
      const config = JSON.parse(cleanedContent);
      
      return {
        exists: true,
        name: config.name,
        kvNamespaces: config.kv_namespaces || [],
        vars: config.vars || {},
        ...config
      };
    } catch (parseError) {
      // If parsing fails, just return basic info
      return {
        exists: true,
        parseError: true
      };
    }
  } catch (error) {
    return {
      exists: false,
      error: error.message
    };
  }
}