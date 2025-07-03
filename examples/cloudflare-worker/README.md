# OnePipe Cloudflare Worker

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/richardmaccaw/onepipe/tree/main/examples/cloudflare-worker)

A Segment-compatible event collector that runs on Cloudflare Workers with queue-based processing and configurable destinations.

## 🚀 Quick Deploy

Click the **Deploy to Cloudflare Workers** button above to automatically:

- Fork this repository to your GitHub account
- Set up Cloudflare Workers with KV storage and Queues
- Deploy the worker to your Cloudflare account
- Configure CI/CD for automatic deployments

## 🎯 Features

- **Segment-compatible API** - Drop-in replacement for Segment's tracking API
- **Queue-based processing** - Reliable event processing with automatic retries
- **Configurable destinations** - Add destinations like BigQuery, Mixpanel, etc.
- **Global edge deployment** - Fast event collection worldwide
- **TypeScript support** - Full type safety and IntelliSense

## 📡 API Endpoints

### Track Events
```bash
POST /track
```
```json
{
  "type": "track",
  "userId": "user123",
  "event": "button_clicked",
  "properties": {
    "button_name": "signup",
    "page": "homepage"
  }
}
```

### Identify Users
```bash
POST /identify
```
```json
{
  "type": "identify",
  "userId": "user123",
  "traits": {
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Page Views
```bash
POST /page
```
```json
{
  "type": "page",
  "userId": "user123",
  "name": "Homepage",
  "properties": {
    "url": "https://example.com"
  }
}
```

## 🔧 Adding Destinations

This worker supports pluggable destinations. To add BigQuery support:

### 1. Install the destination package
```bash
npm install @onepipe/destination-bigquery
```

### 2. Configure the destination
Edit `src/destination-loader.ts` and update the configuration:

```typescript
const defaultConfig = {
  destinations: ['@onepipe/destination-bigquery']
}
```

### 3. Set up environment variables
Add your BigQuery credentials as Cloudflare Worker environment variables:
- `GOOGLE_CLOUD_PROJECT_ID`
- `GOOGLE_CLOUD_PRIVATE_KEY`
- `GOOGLE_CLOUD_CLIENT_EMAIL`

### 4. Deploy
```bash
npm run deploy
```

## 🏗️ Local Development

### Prerequisites
- Node.js 18+
- Cloudflare account
- Wrangler CLI

### Setup
```bash
# Clone and install
git clone <your-repo>
cd onepipe-cloudflare-worker
npm install

# Login to Cloudflare
npx wrangler login

# Create required resources
npx wrangler kv:namespace create TOKEN_CACHE
npx wrangler queues create onepipe-queue

# Update wrangler.toml with the created IDs
# (The deploy button does this automatically)

# Start development
npm run dev
```

## 🔨 Configuration

### Wrangler Configuration
The `wrangler.toml` file configures:
- KV namespace for token caching
- Queue for event processing  
- Environment variables
- Routes and domains

### Destination Configuration
Modify `src/destination-loader.ts` to:
- Add new destination packages
- Configure destination settings
- Set up authentication

## 📊 Available Destinations

| Destination | Package | Description |
|-------------|---------|-------------|
| BigQuery | `@onepipe/destination-bigquery` | Google Cloud BigQuery data warehouse |
| Mixpanel | `@onepipe/destination-mixpanel` | Product analytics platform |
| Custom | Write your own | Implement the `Destination` interface |

## 🔐 Security

- Events are validated using Zod schemas
- CORS is configured for cross-origin requests
- Environment variables for sensitive credentials
- Queue processing prevents data loss

## 🚦 Monitoring

- Built-in health check at `/health`
- Queue message retries on failures
- Cloudflare Analytics integration
- Error logging to console

## 🔄 CI/CD

After deployment, every push to your main branch will:
1. Build the TypeScript code
2. Deploy to Cloudflare Workers
3. Update queue and KV configurations

## 📖 API Reference

### Event Schema
All events support these common fields:
- `userId` - Unique user identifier
- `anonymousId` - Anonymous session identifier  
- `timestamp` - Event timestamp (auto-generated if not provided)
- `context` - Additional context (user agent, page info, etc.)
- `properties` - Custom event properties

### Environment Variables
- `TOKEN_CACHE` - KV namespace binding for caching
- `QUEUE` - Queue binding for event processing
- Plus any destination-specific variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run dev`
5. Deploy and test with `npm run deploy`
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [OnePipe Issues](https://github.com/richardmaccaw/onepipe/issues)
- [Cloudflare Community](https://community.cloudflare.com/)

---

Made with ❤️ for the developer community. Deploy in seconds, customize for your needs!