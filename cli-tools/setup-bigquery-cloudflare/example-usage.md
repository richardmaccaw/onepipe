# Example Usage

## Prerequisites

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Authenticate with Cloudflare:
```bash
wrangler login
```

3. Ensure you have a `wrangler.jsonc` file in your worker directory

## Running the CLI

```bash
# Navigate to your worker directory
cd /path/to/your/worker

# Run the setup tool
npx setup-bigquery-cloudflare
```

## What you'll be prompted for:

1. **BigQuery Project ID** - Your GCP project ID (not masked)
2. **BigQuery Dataset ID** - Your BigQuery dataset name (not masked)
3. **Service Account Key** - Opens an editor to paste your JSON key
4. **Confirmation** - Confirm to proceed with setup

## What the tool does:

1. ✅ Checks for wrangler installation
2. ✅ Verifies wrangler.jsonc exists in current directory
3. ✅ Validates your BigQuery service account key
4. ✅ Stores service account key as a Cloudflare secret using `wrangler secret put`
5. ✅ Provides configuration snippet for your wrangler.jsonc

## Manual steps after running:

Add the environment variables to your `wrangler.jsonc`:

```jsonc
{
  "name": "bigquery-destination",
  "main": "src/index.js",
  "compatibility_date": "2024-01-01",
  "vars": {
    "BIGQUERY_PROJECT_ID": "my-gcp-project",
    "BIGQUERY_DATASET_ID": "my_dataset",
    // ... other vars
  }
}
```

## Security Features

- Service account key is ALWAYS stored as a Cloudflare secret
- Temporary files are automatically cleaned up
- No sensitive data is logged to console

## Sample output

```
🚀 BigQuery Wrangler Setup Tool

✓ Wrangler CLI found: ⛅️ wrangler 3.22.1

Please provide your BigQuery configuration:

ℹ️  This tool assumes you have a wrangler.jsonc file in the current directory
   and are already authenticated with Cloudflare via wrangler login

? BigQuery Project ID: my-gcp-project
? BigQuery Dataset ID: analytics_dataset
? Paste your BigQuery Service Account Key JSON (opens editor): Received
? Ready to set up environment variables and secrets? Yes

🔍 Checking for wrangler configuration...
✓ Found wrangler.jsonc

📝 Setting environment variables...
   Setting BIGQUERY_PROJECT_ID...
   Note: BIGQUERY_PROJECT_ID should be added to your wrangler.jsonc vars section
   Setting BIGQUERY_DATASET_ID...
   Note: BIGQUERY_DATASET_ID should be added to your wrangler.jsonc vars section

🔐 Setting service account key as secret...
   Running: wrangler secret put BIGQUERY_SERVICE_ACCOUNT_KEY
✓ Service account key stored as secret

📋 Manual Configuration Required:
────────────────────────────────────────────────────────────
Add these environment variables to your wrangler.jsonc:

{
  "vars": {
    "BIGQUERY_PROJECT_ID": "my-gcp-project",
    "BIGQUERY_DATASET_ID": "analytics_dataset",
    // ... other vars
  }
}
────────────────────────────────────────────────────────────

✅ Secret configuration complete!

The service account key has been stored as a Cloudflare secret.
Don't forget to update your wrangler.jsonc with the environment variables above.

✅ Setup complete!

Next steps:
  1. Deploy your worker: wrangler deploy
  2. Test the BigQuery connection
  3. Start sending data to BigQuery