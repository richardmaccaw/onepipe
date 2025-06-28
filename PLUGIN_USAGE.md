# Plugin Usage

## Installation

Install destination plugins:

```bash
pnpm add @onepipe/destination-bigquery
```

Configure in `onepipe.config.json`:

```json
{
  "destinations": ["@onepipe/destination-bigquery"]
}
```

## Configuration

Set environment variables:

```bash
# BigQuery
BIGQUERY_PROJECT_ID=your-project
BIGQUERY_DATASET_ID=analytics
```

Set secrets:

```bash
wrangler secret put GOOGLE_CLOUD_CREDENTIALS
```

## Deployment

```bash
pnpm build
pnpm deploy
```

## Creating Plugins

Implement the `DestinationPlugin` interface:

```typescript
import type { DestinationPlugin } from "@onepipe/core";

export const destinationExample: DestinationPlugin = {
  name: "@onepipe/destination-example",
  setup(env) {
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
