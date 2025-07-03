# OnePipe BigQuery Destination

A destination plugin for OnePipe that sends event data to Google BigQuery. This package automatically creates tables and schemas based on your event data and provides seamless integration with BigQuery's streaming insert API.

## Features

- 🚀 **Auto-schema creation**: Automatically creates BigQuery tables and schemas based on event properties
- 📊 **Event support**: Handles `track` and `identify` events from OnePipe
- 🔒 **Secure authentication**: Uses Google Cloud service account credentials with token caching
- ⚡ **Optimized performance**: Batched inserts with automatic retries and caching
- 🔄 **Type conversion**: Automatic data type detection and conversion for BigQuery compatibility

## Installation

Install the package in your OnePipe project:

```bash
pnpm add @onepipe/destination-bigquery
```

## Configuration

### 1. Google Cloud Setup

First, create a Google Cloud project and enable the BigQuery API:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the [BigQuery API](https://console.cloud.google.com/apis/library/bigquery.googleapis.com)
4. Create a BigQuery dataset where your event data will be stored

### 2. Service Account Creation

Create a service account with BigQuery permissions:

1. Go to [IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Click "Create Service Account"
3. Fill in the service account details
4. Grant the following roles:
   - `BigQuery Data Editor`
   - `BigQuery Job User`
5. Create and download the JSON key file

### 3. Environment Variables

Configure the following environment variables in your OnePipe deployment:

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BIGQUERY_PROJECT_ID` | Your Google Cloud project ID | `my-analytics-project` |
| `BIGQUERY_DATASET_ID` | BigQuery dataset ID where tables will be created | `events` |
| `GOOGLE_CLOUD_CREDENTIALS` | Base64 encoded service account JSON | `eyJ0eXBlIjoic2VydmljZV9hY2NvdW50...` |

#### Setting Environment Variables

**For Cloudflare Workers (using Wrangler):**

```bash
# Set non-sensitive variables
wrangler secret put BIGQUERY_PROJECT_ID
wrangler secret put BIGQUERY_DATASET_ID

# Set sensitive credentials (Base64 encoded)
wrangler secret put GOOGLE_CLOUD_CREDENTIALS
```

**For local development (.env file):**

```env
BIGQUERY_PROJECT_ID=your-project-id
BIGQUERY_DATASET_ID=your-dataset-id
GOOGLE_CLOUD_CREDENTIALS=your-base64-encoded-service-account-json
```

### 4. Encoding Service Account Credentials

The `GOOGLE_CLOUD_CREDENTIALS` variable should contain your service account JSON key encoded in Base64:

**On macOS/Linux:**
```bash
base64 -i path/to/your/service-account-key.json
```

**On Windows:**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\your\service-account-key.json"))
```

## Usage

### Basic Setup

Add the BigQuery destination to your OnePipe configuration:

```typescript
import { destinationBigQuery } from '@onepipe/destination-bigquery'

// In your OnePipe setup
const destinations = [
  destinationBigQuery,
  // ... other destinations
]
```

### Event Processing

The destination automatically processes the following event types:

#### Track Events

Track events are stored in tables named after the event with an `events_` prefix:

```typescript
// This track event
{
  type: "track",
  event: "purchase_completed",
  userId: "user123",
  properties: {
    product_id: "prod456",
    amount: 99.99,
    currency: "USD"
  }
}

// Creates/inserts into table: events_purchase_completed
```

#### Identify Events

Identify events are stored in the `events_identify` table:

```typescript
// This identify event
{
  type: "identify",
  userId: "user123",
  traits: {
    email: "user@example.com",
    name: "John Doe",
    plan: "premium"
  }
}

// Creates/inserts into table: events_identify
```

### Table Schema

Tables are automatically created with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| `anonymous_id` | STRING | Anonymous user identifier |
| `user_id` | STRING | User identifier |
| `timestamp` | TIMESTAMP | Event timestamp |
| `received_at` | TIMESTAMP | Server receive timestamp |
| `context_*` | DYNAMIC | Context properties (flattened) |
| `properties_*` | DYNAMIC | Event properties (flattened) |
| `traits_*` | DYNAMIC | User traits (identify events only) |

### Data Types

The destination automatically converts JavaScript types to BigQuery types:

- `string` → `STRING`
- `number` → `FLOAT` or `INTEGER` (auto-detected)
- `boolean` → `BOOLEAN`
- `Date` → `TIMESTAMP`
- `null/undefined` → `NULL`

## Troubleshooting

### Common Issues

#### Missing Environment Variables

```
Error: Missing BIGQUERY_PROJECT_ID environment variable
```

**Solution**: Ensure all required environment variables are set correctly.

#### Authentication Errors

```
Error: 401 Unauthorized
```

**Solution**: 
- Verify your service account JSON is correctly Base64 encoded
- Ensure the service account has the necessary BigQuery permissions
- Check that the BigQuery API is enabled in your Google Cloud project

#### Dataset Not Found

```
Error: Dataset not found
```

**Solution**: 
- Create the dataset in BigQuery console first
- Ensure the `BIGQUERY_DATASET_ID` matches exactly (case-sensitive)
- Verify your service account has access to the dataset

#### Table Creation Failures

```
Error: Access denied creating table
```

**Solution**: 
- Ensure your service account has `BigQuery Data Editor` role
- Verify the dataset exists and is accessible
- Check that table names don't contain invalid characters

### Performance Tips

1. **Batch Events**: OnePipe automatically batches events for better performance
2. **Use Appropriate Data Types**: Send numbers as numbers, not strings, for better BigQuery performance
3. **Consistent Schema**: Keep property names and types consistent across events
4. **Monitor Quota**: Keep an eye on BigQuery streaming insert quotas

## Development

### Building the Package

```bash
# Build the package
pnpm run build

# Watch for changes during development
pnpm run dev
```

### Testing

Create a `.env` file with your test credentials and run:

```bash
# Run type checking
pnpm run check:types
```

## Support

For issues specific to the BigQuery destination:
- Check the [BigQuery documentation](https://cloud.google.com/bigquery/docs)
- Review [service account permissions](https://cloud.google.com/bigquery/docs/access-control)

For general OnePipe issues:
- See the main [OnePipe documentation](../../README.md)

## License

Part of the OnePipe project. See the main repository for license information.