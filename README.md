# Segment Cloudflare Worker

This Cloudflare Worker is designed to receive Segment events and send them to Google's BigQuery. It provides a SegmentJS compatible HTTP interface for receiving events.
Endpoints

The worker exposes several endpoints for different types of events:

- `POST /t` and `POST /track`: These endpoints are used to track events. They expect a JSON payload conforming to the TrackEvent schema defined in src/types.ts.

- `POST /i` and `POST /identify`: These endpoints are used to identify users. They expect a JSON payload conforming to the IdentifyEvent schema defined in src/types.ts.

- `POST /p` and `POST /page`: These endpoints are used to track page views. They expect a JSON payload conforming to the PageEvent schema defined in src/types.ts.

- `OPTIONS`: This endpoint is used for handling CORS preflight requests.

If a request is made to an endpoint that is not defined, the worker will return a 404 response.
Event Processing

When an event is received, it is first validated against the appropriate schema. If the event is valid, it is then enqueued for processing. The worker processes events in batches, consuming them from the queue and sending them to BigQuery.

The worker ensures that the appropriate table and schema exist in BigQuery before inserting the event. If the table or schema does not exist, it is created.

## Environment Variables

The worker requires several environment variables to be set:

- `BIGQUERY_PROJECT_ID`: The ID of your BigQuery project.
- `BIGQUERY_DATASET_ID`: The ID of your BigQuery dataset.
- `GOOGLE_CLOUD_CREDENTIALS`: Your Google Cloud credentials.
  Deployment

The worker can be deployed using Cloudflare's wrangler CLI. Run `pnpm run deploy` to publish your worker.
Development

To start a development server, run `pnpm dev`. This will start a local server at http://localhost:8787/ where you can interact with your worker.
Testing

Tests can be run using vitest. Run `pnpm test` to execute your tests.

## Setup

- [] Install [pnpm](https://pnpm.io/) and [wrangler](https://developers.cloudflare.com/workers/cli-wrangler/install-update)
- [] Run `pnpm install` to install dependencies
- [] Run `wrangler config` to configure wrangler
- [] Run `wrangler secret put BIGQUERY_PROJECT_ID` to set the project ID
- [] Run `wrangler secret put BIGQUERY_DATASET_ID` to set the dataset ID
- [] Run `wrangler secret put GOOGLE_CLOUD_CREDENTIALS` to set the Google Cloud credentials
- [] Run `wrangler kv:namespace create "GOOGLE_TOKENS"` to create a KV namespace and update `wrangler.toml` with the namespace ID
- [] Run `wrangler queues create onepipe-queue` to create a queue and update `wrangler.toml` with the queue ID
- [] Run `wrangler publish` to publish the worker

## Recording events

The worker respects the same endpoint as Segment's HTTP API. You can use the following code to send events to the worker:

```typescript
fetch("/t", {
  method: "POST",
  body: JSON.stringify({
    type: "track",
    userId: "123",
    event: "my_test_event",
    anonymousId: "000-000-000",
    properties: { my_property: "test" },
  }),
  headers: { "Content-Type": "application/json" },
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Error:", error));
```

See [Segment's documentation](https://segment-docs.netlify.app/docs/connections/spec/track/) for more information.

## We recommend using the Beacon API

The Beacon API is a browser API that allows you to send data to a server without waiting for a response. This is ideal for sending analytics events because it allows you to send events without blocking the user's browser.

```typescript
navigator.sendBeacon(
  "/t",
  JSON.stringify({
    type: "track",
    userId: "123",
    event: "my_test_event",
    anonymousId: "000-000-000",
    properties: { my_property: "test" },
  })
);
```

## Useful Links

- https://segment.com/docs/connections/storage/warehouses/schema/
- https://developers.cloudflare.com/queues/get-started/#related-resources

## Versioning

This repository uses [Changesets](https://github.com/changesets/changesets) to manage versions for all packages in the workspace. After making changes to a package, run:

```bash
pnpm run changeset
```

Follow the prompts to describe your changes. To update package versions locally, run:

```bash
pnpm run version-packages
```

Publishing can then be performed with:

```bash
pnpm run release
```

