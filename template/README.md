# OnePipe - Deploy to Cloudflare

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/YOUR_USERNAME/onepipe-template)

## One-Click Deployment

Click the button above to deploy your own OnePipe analytics infrastructure to Cloudflare Workers.

### What gets deployed:

1. **Cloudflare Worker** - Handles HTTP requests and queues events
2. **KV Namespace** - Caches authentication tokens
3. **Queue** - Processes events asynchronously
4. **Setup Interface** - Guided configuration for destinations

### After deployment:

1. Visit your worker URL + `/setup` with the setup token
2. Choose your destinations (BigQuery, etc.)
3. Complete OAuth authentication
4. Configure project/dataset settings
5. Start sending events!

## Manual Deployment

If you prefer to deploy manually:

```bash
# Clone the template
git clone https://github.com/YOUR_USERNAME/onepipe-template.git
cd onepipe-template

# Install dependencies
npm install

# Set up Google OAuth (optional, can be done later)
export GOOGLE_OAUTH_CLIENT_ID="your-client-id"
export GOOGLE_OAUTH_CLIENT_SECRET="your-client-secret"

# Deploy
node deploy.js
```

## Environment Variables

### Required for OAuth (can be set after deployment):
- `GOOGLE_OAUTH_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_OAUTH_CLIENT_SECRET` - Google OAuth client secret

### Set during configuration:
- `BIGQUERY_PROJECT_ID` - Your Google Cloud project ID
- `BIGQUERY_DATASET_ID` - BigQuery dataset for events
- `SETUP_MODE` - Controls whether setup interface is available

## Usage

Once deployed and configured, send events to your worker:

```javascript
// Track an event
fetch('https://your-worker.your-subdomain.workers.dev/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event: 'Page Viewed',
    userId: 'user123',
    properties: {
      page: '/dashboard',
      title: 'Dashboard'
    }
  })
});

// Identify a user
fetch('https://your-worker.your-subdomain.workers.dev/identify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    traits: {
      email: 'user@example.com',
      name: 'John Doe'
    }
  })
});
```

## Supported Destinations

- ✅ **Google BigQuery** - Full support with auto-schema creation
- 🔜 **Snowflake** - Coming soon
- 🔜 **PostgreSQL** - Coming soon  
- 🔜 **Webhooks** - Coming soon

## Segment Compatibility

OnePipe maintains full compatibility with Segment's HTTP API:

- `POST /track` - Track events
- `POST /identify` - Identify users  
- `POST /page` - Page views
- Same event schemas and payload formats

## Cost

OnePipe runs on Cloudflare's infrastructure with their pricing:

- **Workers**: $5/month for up to 10M requests
- **KV Storage**: $0.50/month for up to 10GB
- **Queue**: $2/month for up to 1M operations

Significantly cheaper than Segment for high-volume usage.

## Support

- [Documentation](https://docs.onepipe.dev)
- [GitHub Issues](https://github.com/YOUR_USERNAME/onepipe/issues)
- [Discord Community](https://discord.gg/onepipe)