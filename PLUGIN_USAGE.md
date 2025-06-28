# OnePipe Plugin Usage Guide

## How to Use Destination Plugins

OnePipe uses an npm-style plugin system where you only install and bundle the destination plugins you actually need.

### 1. Install Destination Packages

Install only the destination plugins you want to use:

```bash
# Install BigQuery destination
pnpm add @onepipe/destination-bigquery

# Install multiple destinations
pnpm add @onepipe/destination-bigquery @onepipe/destination-s3 @onepipe/destination-webhook
```

### 2. Configure Your Destinations

Create or update `onepipe.config.json` in your project root:

```json
{
  "destinations": ["@onepipe/destination-bigquery"],
  "pluginConfigs": {
    "@onepipe/destination-bigquery": {
      "projectId": "${BIGQUERY_PROJECT_ID}",
      "datasetId": "${BIGQUERY_DATASET_ID}",
      "tablePrefix": "onepipe_"
    }
  }
}
```

### 3. Plugin Configuration Options

#### Environment Variables

Set environment variables directly in `wrangler.toml` or use config values:

```json
{
  "pluginConfigs": {
    "@onepipe/destination-bigquery": {
      "projectId": "my-project-id",
      "datasetId": "analytics"
    }
  }
}
```

Or let Cloudflare Worker environment provide them:
```json
{
  "pluginConfigs": {
    "@onepipe/destination-bigquery": {}
  }
}
```

#### Auto-Discovery Mode
If you don't specify `destinations` in the config, OnePipe will automatically load all installed destination packages:

```json
{
  "pluginConfigs": {
    "@onepipe/destination-bigquery": {
      "tablePrefix": "analytics_"
    }
  }
}
```

### 4. Available Destination Plugins

- `@onepipe/destination-bigquery` - Google BigQuery
- `@onepipe/destination-s3` - Amazon S3 (coming soon)
- `@onepipe/destination-webhook` - HTTP Webhooks (coming soon)
- `@onepipe/destination-postgres` - PostgreSQL (coming soon)

### 5. Bundle Optimization

Only installed plugins are included in your bundle:

```bash
# Only BigQuery code will be bundled
pnpm add @onepipe/destination-bigquery

# Both BigQuery and S3 code will be bundled  
pnpm add @onepipe/destination-bigquery @onepipe/destination-s3
```

### 6. Development Workflow

```bash
# Local development
pnpm dev

# Deploy to production (default)
pnpm build
pnpm deploy

# Deploy to staging environment
wrangler deploy --env staging

# Deploy to production environment  
wrangler deploy --env production
```

### 7. Environment Management

Set environment variables directly in `wrangler.toml`:

```toml
name = "onepipe"

[env.staging]
name = "onepipe-staging"
BIGQUERY_PROJECT_ID = "my-staging-project"
BIGQUERY_DATASET_ID = "analytics_staging"

[env.production]
name = "onepipe-production"
BIGQUERY_PROJECT_ID = "my-production-project"
BIGQUERY_DATASET_ID = "analytics_production"
```

For sensitive values, use secrets:
```bash
# Set secrets per environment
wrangler secret put GOOGLE_CLOUD_CREDENTIALS --env staging
wrangler secret put GOOGLE_CLOUD_CREDENTIALS --env production
```

## Plugin-Specific Configuration

### BigQuery Destination

```json
{
  "pluginConfigs": {
    "@onepipe/destination-bigquery": {
      "projectId": "my-gcp-project",
      "datasetId": "analytics",
      "tablePrefix": "onepipe_",
      "credentials": "${GOOGLE_CLOUD_CREDENTIALS}"
    }
  }
}
```

**Required Environment Variables:**
- `BIGQUERY_PROJECT_ID` - Your GCP project ID
- `BIGQUERY_DATASET_ID` - BigQuery dataset name  
- `GOOGLE_CLOUD_CREDENTIALS` - Base64-encoded service account JSON

Set these directly in `wrangler.toml` or use `wrangler secret put` for sensitive values.

## Creating Custom Plugins

To create a new destination plugin:

1. Create a package `@onepipe/destination-{name}`
2. Implement the `DestinationPlugin` interface
3. Export as default export
4. Add to the potential plugins list in `plugin-loader.ts`

Example plugin structure:

```typescript
import type { DestinationPlugin } from '@onepipe/core'

export const destinationExample: DestinationPlugin = {
  name: '@onepipe/destination-example',
  setup(env, config = {}) {
    return {
      track: async (event) => {
        // Handle track events
      },
      identify: async (event) => {
        // Handle identify events  
      },
      page: async (event) => {
        // Handle page events
      }
    }
  }
}

export default destinationExample
```