import { execSync } from 'child_process';

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