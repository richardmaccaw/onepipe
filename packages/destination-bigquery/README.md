# @onepipe/destination-bigquery

BigQuery destination plugin for [OnePipe](https://github.com/richardmaccaw/onepipe): an open-source Segment alternative built on Cloudflare Workers.

This package enables event ingestion into Google BigQuery, with auto-creation of tables and schema management.

## Features

- Sends events from OnePipe to Google BigQuery
- Auto-creates tables and manages schemas
- Supports all Segment-compatible event types

## Installation

This package is part of the OnePipe monorepo and is not intended for standalone installation. It is loaded as a destination plugin via OnePipe's configuration.

## Configuration

To use this destination, add it to your `onepipe-configuration.json` destinations array:

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

## Environment Variables

Set these in your Cloudflare Worker dashboard or via `wrangler secret put`:

**Required:**

- `GOOGLE_CLOUD_CREDENTIALS` - Base64 encoded service account JSON
- `BIGQUERY_PROJECT_ID` - Your BigQuery project ID
- `BIGQUERY_DATASET_ID` - Your BigQuery dataset ID

## Development

- This package is built with TypeScript.
- To build: `pnpm run build` (from the repo root or with workspace filter)

## Useful Links

- [BigQuery Schema Reference](https://segment.com/docs/connections/storage/warehouses/schema/)
- [Cloudflare Queues](https://developers.cloudflare.com/queues/get-started/#related-resources)
