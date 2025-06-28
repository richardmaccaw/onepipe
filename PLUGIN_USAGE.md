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

#### Environment Variable Resolution

- Use `${ENV_VAR_NAME}` to reference environment variables
- Values fall back to Cloudflare Worker environment bindings
- Direct values override environment variables

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
# Build and deploy with your selected plugins
pnpm build
pnpm deploy

# Development with live reload
pnpm dev
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

## Creating Custom Plugins

To create a new destination plugin:

1. Create a package `@onepipe/destination-{name}`
2. Implement the `DestinationPlugin` interface
3. Export as default export
4. Add to the potential plugins list in `plugin-loader.ts`

Example plugin structure:

```typescript
import type { DestinationPlugin } from "@onepipe/core";

export const destinationExample: DestinationPlugin = {
  name: "@onepipe/destination-example",
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
      },
    };
  },
};

export default destinationExample;
```
