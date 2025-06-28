# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `pnpm dev` - Start local development server at http://localhost:8787/
- `pnpm install` - Install all workspace dependencies
- `pnpm check:types` - Run TypeScript type checking

### Building
- `pnpm build` - Build all packages in workspace
- `pnpm build:client` - Build only the client SDK package
- `pnpm build:core` - Build only the core package
- `pnpm build:destination-bigquery` - Build only the BigQuery destination package

### Deployment
- `pnpm run deploy` - Deploy the Cloudflare Worker to production
- `wrangler queues create onepipe-queue` - Create the required Cloudflare Queue
- `wrangler kv:namespace create "GOOGLE_TOKENS"` - Create KV namespace for token caching

### Package Development
- `pnpm dev:client` - Start client package in development mode
- `pnpm --filter @onepipe/[package-name] [command]` - Run commands on specific packages

## Architecture Overview

OnePipe is an open-core Segment alternative built on Cloudflare Workers with a plugin-based architecture.

### Core Components

**Cloudflare Worker (`src/worker.ts`)**
- Dual-mode handler: HTTP requests + Queue consumer
- Uses `cloudflare-basics` router for endpoint management
- Event flow: HTTP → Queue → Async processing → Destination plugins

**Plugin System (`src/plugin-loader.ts`)**
- Singleton pattern for plugin instances
- Configuration-driven loading via `onepipe.config.json`
- Dynamic imports with standardized `DestinationPlugin` interface
- Each plugin implements optional methods: `identify()`, `track()`, `page()`

**Queue Processing (`src/queue/consumer.ts`)**
- Asynchronous event processing with automatic retry
- Configurable batch size (default: 10) and timeout (default: 5s)
- Routes messages to appropriate plugin handlers

### Monorepo Structure

**`@onepipe/core`** - Foundation package containing:
- Zod schemas for event validation
- Plugin contracts and environment types
- Segment-compatible event structures

**`@onepipe/client`** - Browser/Node SDK:
- Drop-in replacement for Segment SDK
- TypeScript support with automatic context enrichment

**`@onepipe/destination-bigquery`** - BigQuery plugin:
- Auto-creates tables and schemas
- Google Cloud service account authentication
- Bulk event insertion with proper type mapping

### Configuration

**Plugin Configuration (`onepipe.config.json`)**
```json
{
  "destinations": ["@onepipe/destination-bigquery"]
}
```

**Environment Variables (Cloudflare Secrets)**
- `BIGQUERY_PROJECT_ID` - BigQuery project identifier
- `BIGQUERY_DATASET_ID` - BigQuery dataset identifier  
- `GOOGLE_CLOUD_CREDENTIALS` - Service account JSON (base64 encoded)

**Infrastructure (`wrangler.toml`)**
- KV namespace `TOKEN_CACHE` for Google token caching
- Queue `onepipe-queue` for async event processing
- Observability logging enabled

### Event Processing Flow

1. **HTTP Request** → Route handler validates event schema
2. **Queue** → Event enqueued for async processing
3. **Consumer** → Processes events in batches
4. **Plugin System** → Routes to configured destination plugins
5. **Destination** → Sends to external service (BigQuery, etc.)

### Key Patterns

**Plugin Development**
- Implement `DestinationPlugin` interface
- Export default object with `name` and `setup()` function
- `setup()` returns instance with optional event handlers
- Add to `onepipe.config.json` destinations array

**Type Safety**
- All events validated with Zod schemas
- Strict TypeScript across all packages
- Runtime type checking with compile-time inference

**Error Handling**
- Queue retry logic for failed events
- Graceful degradation for plugin failures
- Early validation with detailed error responses

### Development Workflow

1. **Plugin Development**: Create in `packages/destination-[name]/`
2. **Core Changes**: Modify types in `@onepipe/core` package
3. **Client Changes**: Update SDK in `@onepipe/client` package
4. **Testing**: Use `pnpm dev` with local requests to test endpoints
5. **Deployment**: Use `pnpm run deploy` for production deployment

### API Compatibility

OnePipe maintains full Segment HTTP API compatibility:
- `POST /t` or `/track` - Track events
- `POST /i` or `/identify` - Identify users  
- `POST /p` or `/page` - Page views
- `OPTIONS` - CORS preflight handling

Endpoints accept standard Segment event payloads with identical schemas.