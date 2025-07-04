# Example Usage

## Running the CLI

```bash
cd cli-tools/setup-bigquery-cloudflare
npm install
npm start
```

## What you'll be prompted for:

1. **Cloudflare Account ID** - Your Cloudflare account identifier
2. **Cloudflare API Token** - API token with Workers permissions (masked input)
3. **Worker Name** - Name of your worker (default: bigquery-destination)
4. **BigQuery Project ID** - Your GCP project ID (not masked)
5. **BigQuery Dataset ID** - Your BigQuery dataset name (not masked)
6. **Service Account Key** - Opens an editor to paste your JSON key

## Security Features

- API Token input is masked with asterisks
- Service account key is ALWAYS stored as a Cloudflare secret
- Project ID and Dataset ID are stored as regular environment variables (non-sensitive)

## Sample wrangler.toml output

```toml
name = "bigquery-destination"
main = "src/index.js"
compatibility_date = "2024-01-01"
account_id = "your-account-id"

[vars]
BIGQUERY_PROJECT_ID = "your-project-id"
BIGQUERY_DATASET_ID = "your-dataset-id"

# Run this command to set the service account key secret:
# wrangler secret put BIGQUERY_SERVICE_ACCOUNT_KEY < service-account-key.json
```

## Using with npx

Once published to npm:
```bash
npx setup-bigquery-cloudflare
```