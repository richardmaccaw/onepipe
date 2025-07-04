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

## Interactive Flow

The tool will prompt you for:

1. **Storage Method** - Choose how to store configuration:
   - Environment Variables (vars in wrangler.jsonc)
   - Secrets (using wrangler secret)
   - KV Namespace (if available)

2. **KV Namespace** (if KV option selected) - Select from available namespaces

3. **BigQuery Project ID** - Your GCP project ID

4. **BigQuery Dataset ID** - Your BigQuery dataset name

5. **Service Account Key** - Opens editor to paste JSON key

6. **Confirmation** - Confirm to proceed with setup

## Example Outputs

### Option 1: Environment Variables

```
🚀 BigQuery Wrangler Setup Tool

✓ Wrangler CLI found: ⛅️ wrangler 3.22.1

? How would you like to store the configuration? Environment Variables (vars in wrangler.jsonc)
? BigQuery Project ID: my-gcp-project
? BigQuery Dataset ID: analytics_dataset
? Paste your BigQuery Service Account Key JSON (opens editor): Received
? Ready to set up configuration? Yes

📝 Setting up with Environment Variables

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

✅ Configuration complete!
```

### Option 2: Secrets

```
🚀 BigQuery Wrangler Setup Tool

✓ Wrangler CLI found: ⛅️ wrangler 3.22.1

? How would you like to store the configuration? Secrets (using wrangler secret)
? BigQuery Project ID: my-gcp-project
? BigQuery Dataset ID: analytics_dataset
? Paste your BigQuery Service Account Key JSON (opens editor): Received
? Ready to set up configuration? Yes

� Setting up with Secrets

Setting secret BIGQUERY_PROJECT_ID...
✓ Secret BIGQUERY_PROJECT_ID stored

Setting secret BIGQUERY_DATASET_ID...
✓ Secret BIGQUERY_DATASET_ID stored

🔐 Setting service account key as secret...
Running: wrangler secret put BIGQUERY_SERVICE_ACCOUNT_KEY
✓ Service account key stored as secret

✅ All configuration stored as secrets
Access these in your worker using:
  env.BIGQUERY_PROJECT_ID
  env.BIGQUERY_DATASET_ID
  env.BIGQUERY_SERVICE_ACCOUNT_KEY

✅ Configuration complete!
```

### Option 3: KV Namespace

```
🚀 BigQuery Wrangler Setup Tool

✓ Wrangler CLI found: ⛅️ wrangler 3.22.1
✓ KV namespaces found: CONFIG_KV, CACHE_KV

? How would you like to store the configuration? KV Namespace
? Select KV namespace: CONFIG_KV (abc123def456)
? BigQuery Project ID: my-gcp-project
? BigQuery Dataset ID: analytics_dataset
? Paste your BigQuery Service Account Key JSON (opens editor): Received
? Ready to set up configuration? Yes

📦 Setting up with KV Namespace: CONFIG_KV

Storing configuration in KV namespace...
Running: wrangler kv:key put
✓ Configuration stored in KV namespace

✅ Configuration stored in KV namespace
Access this in your worker using:
  const config = await env.CONFIG_KV.get('bigquery-config', 'json')

✅ Configuration complete!
```

## Worker Code Examples

### Accessing Environment Variables Configuration

```javascript
export default {
  async fetch(request, env) {
    const projectId = env.BIGQUERY_PROJECT_ID;
    const datasetId = env.BIGQUERY_DATASET_ID;
    const serviceAccountKey = env.BIGQUERY_SERVICE_ACCOUNT_KEY;
    
    // Use with BigQuery client...
  }
}
```

### Accessing Secrets Configuration

```javascript
export default {
  async fetch(request, env) {
    // Exactly the same as environment variables
    const projectId = env.BIGQUERY_PROJECT_ID;
    const datasetId = env.BIGQUERY_DATASET_ID;
    const serviceAccountKey = env.BIGQUERY_SERVICE_ACCOUNT_KEY;
    
    // Use with BigQuery client...
  }
}
```

### Accessing KV Configuration

```javascript
export default {
  async fetch(request, env) {
    const config = await env.CONFIG_KV.get('bigquery-config', 'json');
    
    const projectId = config.projectId;
    const datasetId = config.datasetId;
    const serviceAccountKey = config.serviceAccountKey;
    
    // Use with BigQuery client...
  }
}
```

## Tips

- Use **Environment Variables** for non-sensitive config that changes between environments
- Use **Secrets** when you want everything secure and don't mind the extra API calls
- Use **KV Namespace** for dynamic or multi-tenant configurations
- Service account keys are always stored securely regardless of the option chosen