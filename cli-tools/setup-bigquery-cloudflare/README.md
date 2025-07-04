# BigQuery Wrangler Setup Tool

A comprehensive CLI tool to configure BigQuery destination settings using Cloudflare Wrangler CLI with support for environment variables, secrets, and KV namespaces.

## Features

- Interactive setup wizard
- Multiple storage options for configuration
- Uses Wrangler CLI for all operations
- Validates BigQuery service account credentials
- Supports environment variables, secrets, and KV namespaces

## Prerequisites

- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed
- Authenticated with Cloudflare via `wrangler login`
- A Cloudflare Worker with `wrangler.jsonc` configuration file
- BigQuery service account with appropriate permissions
- (Optional) KV namespace configured in wrangler.jsonc

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

## Storage Options

The tool offers three ways to store your BigQuery configuration:

### 1. Environment Variables (Recommended for non-sensitive data)
- Stores project ID and dataset ID as environment variables in `wrangler.jsonc`
- Service account key is always stored as a secret
- Requires manual update to `wrangler.jsonc`

### 2. Secrets (Secure for all data)
- Stores all configuration as Cloudflare secrets using `wrangler secret put`
- Most secure option but requires more API calls
- No manual configuration needed

### 3. KV Namespace (For dynamic configuration)
- Stores all configuration in a KV namespace
- Useful for multi-tenant or dynamic configurations
- Requires a KV namespace to be configured in `wrangler.jsonc`

## Configuration Examples

### Using Environment Variables

After running the tool with the "Environment Variables" option, add to your `wrangler.jsonc`:

```jsonc
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

Access in your worker:
```javascript
const projectId = env.BIGQUERY_PROJECT_ID;
const datasetId = env.BIGQUERY_DATASET_ID;
const serviceAccountKey = env.BIGQUERY_SERVICE_ACCOUNT_KEY; // From secret
```

### Using Secrets

No manual configuration needed. Access in your worker:
```javascript
const projectId = env.BIGQUERY_PROJECT_ID;
const datasetId = env.BIGQUERY_DATASET_ID;
const serviceAccountKey = env.BIGQUERY_SERVICE_ACCOUNT_KEY;
```

### Using KV Namespace

First, ensure you have a KV namespace in your `wrangler.jsonc`:
```jsonc
{
  "kv_namespaces": [
    {
      "binding": "CONFIG_KV",
      "id": "your-kv-namespace-id"
    }
  ]
}
```

Access in your worker:
```javascript
const config = await env.CONFIG_KV.get('bigquery-config', 'json');
// config.projectId
// config.datasetId
// config.serviceAccountKey
```

## Security

- Service account keys are always stored securely (as secrets or encrypted in KV)
- The tool uses temporary files that are automatically cleaned up
- All sensitive operations use Wrangler's built-in security features

## Troubleshooting

- **"Wrangler CLI is not installed"**: Install wrangler with `npm install -g wrangler`
- **"wrangler.jsonc not found"**: Run the tool from your worker directory
- **Authentication errors**: Run `wrangler login` first
- **KV namespace errors**: Ensure your KV namespace is properly configured in wrangler.jsonc

## License

MIT