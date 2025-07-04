# BigQuery Wrangler Setup Tool

A minimal CLI tool to help developers configure BigQuery destination settings using Cloudflare Wrangler CLI.

## Features

- Interactive setup wizard
- Uses Wrangler CLI for authentication
- Securely stores service account key as Cloudflare secret
- Validates BigQuery service account credentials
- Provides wrangler.jsonc configuration snippets

## Prerequisites

- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed
- Authenticated with Cloudflare via `wrangler login`
- A Cloudflare Worker with `wrangler.jsonc` configuration file
- BigQuery service account with appropriate permissions

## Usage

### Run with npx (no installation required)

```bash
# From your worker directory (where wrangler.jsonc exists)
npx setup-bigquery-cloudflare
```

### Or install globally

```bash
npm install -g setup-bigquery-cloudflare
# Then from your worker directory:
setup-bigquery-cloudflare
```

### Local development

```bash
# Install dependencies
npm install

# Run from your worker directory
cd /path/to/your/worker
node /path/to/cli-tools/setup-bigquery-cloudflare/cli.js
```

## Required Information

You'll need the following information ready:

**BigQuery:**
- Project ID
- Dataset ID
- Service Account Key (JSON)

## Configuration

The tool will:

1. **Set up a Cloudflare Secret:**
   - `BIGQUERY_SERVICE_ACCOUNT_KEY` (automatically via wrangler)

2. **Provide configuration for wrangler.jsonc:**
   - `BIGQUERY_PROJECT_ID` (environment variable)
   - `BIGQUERY_DATASET_ID` (environment variable)

### Example wrangler.jsonc configuration

After running the tool, add the environment variables to your `wrangler.jsonc`:

```json
{
  "name": "your-worker-name",
  "main": "src/index.js",
  "compatibility_date": "2024-01-01",
  "vars": {
    "BIGQUERY_PROJECT_ID": "your-project-id",
    "BIGQUERY_DATASET_ID": "your-dataset-id"
  }
}
```

## Security

The BigQuery service account key is always stored as a Cloudflare secret using `wrangler secret put` to ensure proper security. Environment variables for project ID and dataset ID are non-sensitive and can be stored in the `vars` section of your wrangler.jsonc.

## Troubleshooting

- **"Wrangler CLI is not installed"**: Install wrangler with `npm install -g wrangler`
- **"wrangler.jsonc not found"**: Run the tool from your worker directory
- **Authentication errors**: Run `wrangler login` first

## License

MIT