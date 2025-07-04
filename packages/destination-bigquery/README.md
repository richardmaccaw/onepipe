# @onepipe/destination-bigquery

BigQuery destination plugin for [OnePipe](https://github.com/richardmaccaw/onepipe): an open-source Segment alternative built on Cloudflare Workers.

This package enables event ingestion into Google BigQuery, with auto-creation of tables and schema management.

## Features

- Sends events from OnePipe to Google BigQuery
- Auto-creates tables and manages schemas
- Supports all Segment-compatible event types

## Installation

This package is part of the OnePipe monorepo and is not intended for standalone installation. It is loaded as a destination plugin via OnePipe's configuration.

## Quick Setup

We provide an interactive setup tool to help you configure BigQuery:

```bash
# From workspace root
pnpm run setup:bigquery

# Or directly from this package
pnpm --filter @onepipe/destination-bigquery run setup

# Or run the script directly
cd packages/destination-bigquery && node setup.js
```

### What the setup tool does:

- 🔍 **Interactive prompts** for BigQuery project ID and dataset ID with validation
- 🔐 **Automatic credential upload** to Cloudflare Worker Secrets
- 📊 **KV configuration** for non-sensitive project/dataset IDs
- 📝 **Auto-configuration** updates `onepipe-configuration.json`
- ✅ **Validation** ensures proper BigQuery naming conventions

### Requirements:

- A Google Cloud project with BigQuery enabled
- A service account with BigQuery Data Editor permissions
- The service account JSON key file downloaded locally
- `wrangler` CLI authenticated (`wrangler auth login`)

## Manual Configuration

If you prefer manual setup, add this destination to your `onepipe-configuration.json`:

```json
{
  "destinations": [
    {
      "name": "bigquery",
      "package": "@onepipe/destination-bigquery",
      "options": {}
    }
  ]
}
```

### Configuration Storage

**Sensitive data (Cloudflare Worker Secrets):**
- `GOOGLE_CLOUD_CREDENTIALS` - Base64 encoded service account JSON

**Non-sensitive data (Cloudflare KV metadata):**
- `BIGQUERY_PROJECT_ID` - Your BigQuery project ID
- `BIGQUERY_DATASET_ID` - Your BigQuery dataset ID

Set secrets manually:
```bash
echo "base64-encoded-credentials" | wrangler secret put GOOGLE_CLOUD_CREDENTIALS
```

Set KV metadata manually:
```bash
wrangler kv key put --binding=KV_BINDING "destination-bigquery" '{"configured":true}' --metadata='{"BIGQUERY_PROJECT_ID":"your-project","BIGQUERY_DATASET_ID":"your-dataset"}'
```

## Development

- This package is built with TypeScript
- To build: `pnpm run build` (from the repo root or with workspace filter)
- Setup script included: `setup.js` (interactive BigQuery configuration tool)

## Useful Links

- [BigQuery Schema Reference](https://segment.com/docs/connections/storage/warehouses/schema/)
- [Cloudflare Queues](https://developers.cloudflare.com/queues/get-started/#related-resources)
