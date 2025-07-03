# OnePipe

Open-source Segment alternative built on Cloudflare Workers with a plugin-based architecture.

## 🚀 Quick Start

### Option 1: Deploy Standalone Worker (Recommended)

Use our self-contained Cloudflare Worker template:

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/richardmaccaw/onepipe/tree/worker-deploy)

This deploys a standalone worker without the monorepo structure. Add destinations like BigQuery by running:

```bash
npm install @onepipe/destination-bigquery
```

### Option 2: Deploy Legacy Version

Use the legacy monorepo-based deployment:

[![Deploy Legacy Version](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/richardmaccaw/onepipe/tree/deploy)

### Option 3: Manual Development Setup

1. Clone this repository
2. Install dependencies: `pnpm install`
3. Configure environment variables (see below)
4. Deploy: `pnpm run deploy`

## 📁 Repository Structure

- **`examples/cloudflare-worker/`** - Standalone worker template (recommended for production)
- **`packages/core/`** - Core types and utilities
- **`packages/destination-bigquery/`** - BigQuery destination plugin
- **`src/`** - Legacy worker implementation

## Configuration

### Environment Variables

Set these in your Cloudflare Worker dashboard or via `wrangler secret put`:

**Required:**

- `GOOGLE_CLOUD_CREDENTIALS` - Base64 encoded service account JSON
- `BIGQUERY_PROJECT_ID` - Your BigQuery project ID
- `BIGQUERY_DATASET_ID` - Your BigQuery dataset ID

**Optional:**

- `SETUP_MODE` - Set to `"true"` to enable setup UI
- `SETUP_TOKEN` - Bearer token for setup authentication

### Setup UI

After deployment, if `SETUP_MODE=true`, visit `https://your-worker.workers.dev/setup` to:

1. Complete OAuth flow with Google
2. Auto-discover BigQuery projects and datasets
3. Test your configuration

Access requires Bearer token authentication:

```bash
curl -H "Authorization: Bearer YOUR_SETUP_TOKEN" https://your-worker.workers.dev/setup
```

## API Endpoints

OnePipe provides full Segment HTTP API compatibility:

- `POST /t` or `/track` - Track events
- `POST /i` or `/identify` - Identify users
- `POST /p` or `/page` - Page views
- `OPTIONS` - CORS preflight handling

## Architecture

**Event Flow:**

1. HTTP Request → Route handler validates event schema
2. Queue → Event enqueued for async processing
3. Consumer → Processes events in batches
4. Plugin System → Routes to configured destination plugins
5. BigQuery → Auto-creates tables and inserts events

**Plugin System:**

- Configuration-driven loading via `onepipe.config.json`
- Standardized `DestinationPlugin` interface
- Support for multiple destinations simultaneously

## Development

### Commands

- `pnpm dev` - Start local development server
- `pnpm build` - Build all packages
- `pnpm check:types` - Run TypeScript type checking
- `pnpm run deploy` - Deploy to Cloudflare Workers

### Infrastructure Setup

Create required Cloudflare resources:

```bash
wrangler kv:namespace create "GOOGLE_TOKENS"
wrangler queues create onepipe-queue
```

Update `wrangler.toml` with the generated IDs.

## Recording events

The worker respects the same endpoint as Segment's HTTP API. You can use the following code to send events to the worker:

```typescript
fetch("/t", {
  method: "POST",
  body: JSON.stringify({
    type: "track",
    userId: "123",
    event: "my_test_event",
    anonymousId: "000-000-000",
    properties: { my_property: "test" },
  }),
  headers: { "Content-Type": "application/json" },
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Error:", error));
```

See [Segment's documentation](https://segment-docs.netlify.app/docs/connections/spec/track/) for more information.

## We recommend using the Beacon API

The Beacon API is a browser API that allows you to send data to a server without waiting for a response. This is ideal for sending analytics events because it allows you to send events without blocking the user's browser.

```typescript
navigator.sendBeacon(
  "/t",
  JSON.stringify({
    type: "track",
    userId: "123",
    event: "my_test_event",
    anonymousId: "000-000-000",
    properties: { my_property: "test" },
  })
);
```

## Useful Links

- https://segment.com/docs/connections/storage/warehouses/schema/
- https://developers.cloudflare.com/queues/get-started/#related-resources
