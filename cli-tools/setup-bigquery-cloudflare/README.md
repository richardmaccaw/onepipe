# BigQuery Cloudflare Setup Tool

A minimal CLI tool to help developers configure BigQuery destination settings in Cloudflare Workers.

## Features

- Interactive setup wizard
- Configures Cloudflare environment variables
- Supports storing sensitive data as Cloudflare secrets
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
- Table ID
- Service Account Key (JSON)

## Configuration

The tool will set up the following environment variables in your Cloudflare Worker:

- `BIGQUERY_PROJECT_ID`
- `BIGQUERY_DATASET_ID`
- `BIGQUERY_TABLE_ID`
- `BIGQUERY_SERVICE_ACCOUNT_KEY` (as env var or secret)

## Security

By default, the tool offers to store the BigQuery service account key as a Cloudflare secret for better security. This is recommended for production use.

## Next Steps

After running the setup tool:

1. Deploy your Cloudflare Worker using `wrangler deploy`
2. Test the BigQuery connection
3. Start sending data to BigQuery

## License

MIT