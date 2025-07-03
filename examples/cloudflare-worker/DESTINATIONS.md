# Destinations Guide

This guide explains how to add, configure, and create custom destinations for your OnePipe Cloudflare Worker.

## 🎯 Available Destinations

### BigQuery
**Package:** `@onepipe/destination-bigquery`

Google Cloud BigQuery data warehouse integration.

#### Setup
```bash
npm install @onepipe/destination-bigquery
```

#### Configuration
1. Add to `onepipe.config.json`:
```json
{
  "destinations": ["@onepipe/destination-bigquery"]
}
```

2. Set environment variables in Cloudflare Worker:
```bash
# Required
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_CLOUD_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...

# Optional
BIGQUERY_DATASET_ID=analytics  # defaults to 'onepipe'
```

#### Features
- Automatic table creation
- Schema auto-detection
- Batch inserts for performance
- Error handling and retries

---

### Mixpanel (Example)
**Package:** `@onepipe/destination-mixpanel` *(hypothetical)*

#### Setup
```bash
npm install @onepipe/destination-mixpanel
```

#### Configuration
```json
{
  "destinations": ["@onepipe/destination-mixpanel"]
}
```

Environment variables:
```bash
MIXPANEL_TOKEN=your-project-token
```

---

## 🔧 Adding a Destination

### 1. Install the Package
```bash
npm install @onepipe/destination-your-service
```

### 2. Update Configuration
Edit `onepipe.config.json`:
```json
{
  "destinations": [
    "@onepipe/destination-bigquery",
    "@onepipe/destination-your-service"
  ]
}
```

### 3. Register in Destination Loader
Edit `src/destination-loader.ts`:
```typescript
const DESTINATION_REGISTRY: Record<string, () => Promise<Destination>> = {
  '@onepipe/destination-bigquery': async () => {
    const { destinationBigQuery } = await import('@onepipe/destination-bigquery')
    return destinationBigQuery
  },
  '@onepipe/destination-your-service': async () => {
    const { destinationYourService } = await import('@onepipe/destination-your-service')
    return destinationYourService
  },
}
```

### 4. Set Environment Variables
Add any required environment variables in the Cloudflare Worker dashboard.

### 5. Deploy
```bash
npm run deploy
```

---

## 🛠️ Creating a Custom Destination

### Interface Definition
All destinations must implement the `Destination` interface:

```typescript
export interface Destination {
  name: string
  setup(env: Env): DestinationInstance
}

export interface DestinationInstance {
  identify?(event: IdentifySystemEvent): Promise<void>
  track?(event: TrackSystemEvent): Promise<void>
  page?(event: PageSystemEvent): Promise<void>
}
```

### Example Custom Destination

```typescript
// my-custom-destination.ts
import type { 
  Destination, 
  DestinationInstance, 
  Env,
  TrackSystemEvent,
  IdentifySystemEvent,
  PageSystemEvent,
  createNamespacedCache
} from './types'

class MyCustomDestinationInstance implements DestinationInstance {
  private apiKey: string
  private cache: Cache

  constructor(env: Env) {
    this.apiKey = env.MY_SERVICE_API_KEY
    this.cache = createNamespacedCache(env.TOKEN_CACHE, 'my-service')
  }

  async track(event: TrackSystemEvent): Promise<void> {
    try {
      await fetch('https://api.myservice.com/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'track',
          userId: event.userId,
          event: event.event,
          properties: event.properties,
          timestamp: event.timestamp
        })
      })
    } catch (error) {
      console.error('MyService track error:', error)
      throw error // Will trigger queue retry
    }
  }

  async identify(event: IdentifySystemEvent): Promise<void> {
    // Implementation for identify events
    await fetch('https://api.myservice.com/identify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: event.userId,
        traits: event.traits,
        timestamp: event.timestamp
      })
    })
  }

  async page(event: PageSystemEvent): Promise<void> {
    // Implementation for page events
    // Convert page events to track events
    await this.track({
      ...event,
      event: 'page_view',
      properties: {
        ...event.properties,
        page_name: event.name,
        page_category: event.category
      }
    } as TrackSystemEvent)
  }
}

export const myCustomDestination: Destination = {
  name: 'my-custom-destination',
  setup: (env: Env) => new MyCustomDestinationInstance(env)
}
```

### Registering Your Custom Destination

1. Add your destination file to the `src/` directory
2. Update `src/destination-loader.ts`:

```typescript
import { myCustomDestination } from './my-custom-destination'

const DESTINATION_REGISTRY: Record<string, () => Promise<Destination>> = {
  // ... existing destinations
  'my-custom-destination': async () => myCustomDestination,
}
```

3. Update configuration:
```json
{
  "destinations": ["my-custom-destination"]
}
```

---

## 🔐 Best Practices

### Authentication
- Use environment variables for API keys and secrets
- Use the namespaced cache for storing tokens with TTL
- Implement proper error handling for auth failures

### Error Handling
- Throw errors to trigger queue retries
- Log errors for debugging
- Implement circuit breakers for repeated failures

### Performance
- Use batch APIs when available
- Implement request deduplication if needed
- Cache configuration and tokens appropriately

### Schema Transformation
- Map OnePipe events to your service's schema
- Handle missing or optional fields gracefully
- Validate data before sending to external services

---

## 📊 Event Schema Reference

### Track Event
```typescript
interface TrackSystemEvent {
  id: string
  type: 'track'
  userId?: string
  anonymousId: string
  event: string
  properties?: Record<string, any>
  timestamp: Date
  loadedAt: Date
  receivedAt: Date
  sentAt: Date
  context?: {
    library?: { name: string; version: string }
    page?: { path: string; referrer: string; search: string; title: string; url: string }
    userAgent?: string
    ip: string
  }
}
```

### Identify Event
```typescript
interface IdentifySystemEvent {
  id: string
  type: 'identify'
  userId?: string
  anonymousId: string
  traits?: Record<string, any>
  timestamp: Date
  loadedAt: Date
  receivedAt: Date
  sentAt: Date
  context?: { /* same as track */ }
}
```

### Page Event
```typescript
interface PageSystemEvent {
  id: string
  type: 'track'
  event: 'page'
  userId?: string
  anonymousId: string
  name?: string
  category?: string
  properties?: Record<string, any>
  timestamp: Date
  loadedAt: Date
  receivedAt: Date
  sentAt: Date
  context?: { /* same as track */ }
}
```

---

## 🚀 Publishing Your Destination

If you create a useful destination, consider publishing it as an npm package:

1. Create a new npm package
2. Export your destination following the interface
3. Include TypeScript definitions
4. Add comprehensive documentation
5. Publish to npm with the `@onepipe/destination-` prefix

Example package structure:
```
@onepipe/destination-myservice/
├── src/
│   ├── index.ts
│   └── destination.ts
├── package.json
├── README.md
└── tsconfig.json
```

This allows other users to easily add your destination with:
```bash
npm install @onepipe/destination-myservice
```