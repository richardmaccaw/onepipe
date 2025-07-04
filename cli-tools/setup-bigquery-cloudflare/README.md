# BigQuery Cloudflare Setup Tool

A minimal CLI tool to help developers configure BigQuery destination settings in Cloudflare Workers.

## Features

- Interactive setup wizard
- Configures Cloudflare environment variables
- Securely stores service account key as Cloudflare secret
- Validates BigQuery service account credentials
- Generates wrangler.toml configuration

## Usage

### Run with npx (no installation required)

```bash
npx setup-bigquery-cloudflare
```

### Or install globally

```bash
npm install -g setup-bigquery-cloudflare
setup-bigquery-cloudflare
```

### Local development

```bash
# Install dependencies
npm install

# Run the CLI
npm start
```

## Required Information

You'll need the following information ready:

**Cloudflare:**
- Account ID
- API Token (with Workers permissions)
- Worker Name

**BigQuery:**
- Project ID
- Dataset ID
- Service Account Key (JSON)

## Configuration

The tool will set up the following in your Cloudflare Worker:

**Environment Variables:**
- `BIGQUERY_PROJECT_ID`
- `BIGQUERY_DATASET_ID`

**Secrets:**
- `BIGQUERY_SERVICE_ACCOUNT_KEY` (always stored as a secret for security)

## Security

The BigQuery service account key is always stored as a Cloudflare secret to ensure proper security. This protects your credentials from being exposed in environment variables.

## Next Steps

After running the setup tool:

1. Deploy your Cloudflare Worker using `wrangler deploy`
2. Test the BigQuery connection
3. Start sending data to BigQuery

## License

MIT