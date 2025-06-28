# OnePipe Plugin Usage Guide

## Overview

OnePipe uses an npm-style plugin system where you install only the destination plugins you actually need. This keeps your bundle size small and deployment simple.

## Quick Start

1. **Install a destination plugin**:
   ```bash
   pnpm add @onepipe/destination-bigquery
   ```

2. **Create environment file** `.env`:
   ```bash
   CLOUDFLARE_ACCOUNT_ID=your-account-id
   CLOUDFLARE_API_TOKEN=your-api-token
   BIGQUERY_PROJECT_ID=your-project
   BIGQUERY_DATASET_ID=analytics
   ```

3. **Set sensitive credentials**:
   ```bash
   wrangler secret put GOOGLE_CLOUD_CREDENTIALS
   ```

4. **Deploy**:
   ```bash
   pnpm build && pnpm deploy
   ```

## Installation & Configuration

### 1. Install Destination Packages

Install only the destination plugins you want to use:

```bash
# Install BigQuery destination
pnpm add @onepipe/destination-bigquery

# Install multiple destinations
pnpm add @onepipe/destination-bigquery @onepipe/destination-webhook
```

### 2. Configure Your Destinations

OnePipe automatically discovers installed destination plugins. Optionally create `onepipe.config.json` for custom settings:

```json
{
  "destinations": ["@onepipe/destination-bigquery"],
  "pluginConfigs": {
    "@onepipe/destination-bigquery": {
      "tablePrefix": "onepipe_"
    }
  }
}
```

### 3. Environment Variables

OnePipe follows Cloudflare Workers best practices for environment management using `.env` files.

#### Option 1: Environment-Specific .env Files (Recommended)

Create environment-specific `.env` files in your project root:

**.env** (local development):
```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
BIGQUERY_PROJECT_ID=dev-project
BIGQUERY_DATASET_ID=analytics_dev
```

**.env.staging**:
```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
BIGQUERY_PROJECT_ID=staging-project
BIGQUERY_DATASET_ID=analytics_staging
```

**.env.production**:
```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
BIGQUERY_PROJECT_ID=production-project
BIGQUERY_DATASET_ID=analytics_production
```

#### Option 2: Direct Values in wrangler.toml

```toml
name = "onepipe"

[env.staging]
name = "onepipe-staging"

[env.production]
name = "onepipe-production"
```

#### Option 3: Config Values Override

You can override environment variables in `onepipe.config.json`:

```json
{
  "pluginConfigs": {
    "@onepipe/destination-bigquery": {
      "projectId": "hardcoded-project-id",
      "datasetId": "analytics",
      "tablePrefix": "onepipe_"
    }
  }
}
```

#### Option 4: Auto-Discovery Mode

If you don't specify `destinations`, OnePipe automatically loads all installed destination packages:

```json
{
  "pluginConfigs": {
    "@onepipe/destination-bigquery": {
      "tablePrefix": "analytics_"
    }
  }
}
```

## Available Destination Plugins

- `@onepipe/destination-bigquery` - Google BigQuery ✅
- `@onepipe/destination-s3` - Amazon S3 (coming soon)
- `@onepipe/destination-webhook` - HTTP Webhooks (coming soon)  
- `@onepipe/destination-postgres` - PostgreSQL (coming soon)
- `@onepipe/destination-snowflake` - Snowflake (coming soon)

## Deployment

### Local Development
```bash
# Uses .env file automatically
pnpm dev
```

### Environment-Specific Deployment
```bash
# Deploy to staging (uses .env.staging)
wrangler deploy --env staging

# Deploy to production (uses .env.production) 
wrangler deploy --env production

# Build and deploy to production (default, uses .env)
pnpm build && pnpm deploy
```

### Secrets Management

For sensitive values like credentials, always use Wrangler secrets:

```bash
# Set secrets for local development
wrangler secret put GOOGLE_CLOUD_CREDENTIALS

# Set secrets per environment
wrangler secret put GOOGLE_CLOUD_CREDENTIALS --env staging
wrangler secret put GOOGLE_CLOUD_CREDENTIALS --env production
```

**Important**: Add `.env*` files to `.gitignore` to prevent committing sensitive values:
```gitignore
.env
.env.*
!.env.example
```

## Bundle Optimization

Only installed plugins are included in your bundle:

```bash
# Small bundle - only BigQuery
pnpm add @onepipe/destination-bigquery

# Larger bundle - multiple destinations
pnpm add @onepipe/destination-bigquery @onepipe/destination-webhook
```

## Plugin-Specific Configuration

### BigQuery Destination (`@onepipe/destination-bigquery`)

**Required Environment Variables:**
- `BIGQUERY_PROJECT_ID` - Your GCP project ID
- `BIGQUERY_DATASET_ID` - BigQuery dataset name  
- `GOOGLE_CLOUD_CREDENTIALS` - Base64-encoded service account JSON (use `wrangler secret put`)

**Optional Configuration:**
```json
{
  "pluginConfigs": {
    "@onepipe/destination-bigquery": {
      "tablePrefix": "onepipe_",
      "projectId": "override-project-id",
      "datasetId": "override-dataset-id"
    }
  }
}
```

**Setup Steps:**
1. Create a GCP service account with BigQuery permissions
2. Download the service account JSON and base64 encode it
3. Set environment variables in `wrangler.toml` or use secrets
4. Plugin will auto-create tables and schemas as needed

**Configuration Priority:**
1. Config values in `onepipe.config.json` (highest)
2. Environment variables in `wrangler.toml`
3. Wrangler secrets

## Creating Custom Plugins

### Plugin Development

1. **Create a new package**: `@onepipe/destination-{name}`
2. **Implement the interface**: Follow the `DestinationPlugin` interface
3. **Add to plugin loader**: Update the potential plugins list in `plugin-loader.ts`
4. **Publish**: Make available via npm

### Example Plugin Structure

```typescript
import type { DestinationPlugin } from '@onepipe/core'

export const destinationExample: DestinationPlugin = {
  name: '@onepipe/destination-example',
  setup(env, config = {}) {
    // Plugin initialization logic
    const apiKey = config.apiKey || env.EXAMPLE_API_KEY;
    
    return {
      track: async (event) => {
        // Send track events to your destination
        console.log('Track event:', event);
      },
      identify: async (event) => {
        // Send identify events to your destination  
        console.log('Identify event:', event);
      },
      page: async (event) => {
        // Send page events to your destination
        console.log('Page event:', event);
      }
    }
  }
}

export default destinationExample
```

### Plugin Requirements

- Must export a default object implementing `DestinationPlugin`
- Must handle the `setup(env, config)` method
- Should support configuration via both environment variables and config
- Should provide clear error messages for missing configuration
- Should be published as an npm package with name `@onepipe/destination-*`

## Troubleshooting

### Common Issues

**Plugin not found**: Ensure the plugin package is installed and named correctly
```bash
pnpm add @onepipe/destination-bigquery
```

**Missing environment variables**: Check `wrangler.toml` and secrets
```bash
wrangler secret list
```

**Build errors**: Ensure all packages are built
```bash
pnpm build
```

**Type errors**: Check TypeScript compilation
```bash
pnpm check:types
```