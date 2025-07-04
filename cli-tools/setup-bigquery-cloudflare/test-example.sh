#!/bin/bash

# Example test script for the BigQuery Wrangler Setup Tool

echo "==========================================
BigQuery Wrangler Setup Tool Test
==========================================

This script demonstrates how to use the setup tool.

Prerequisites:
1. Wrangler CLI installed: npm install -g wrangler
2. Authenticated with Cloudflare: wrangler login
3. A worker directory with wrangler.jsonc file

Usage:
1. Navigate to your worker directory:
   cd /path/to/your/worker

2. Run the setup tool:
   npx setup-bigquery-cloudflare

OR if running locally:
   node /path/to/cli-tools/setup-bigquery-cloudflare/cli.js

The tool will:
- Check for wrangler installation
- Verify wrangler.jsonc exists
- Prompt for BigQuery configuration
- Store service account key as a secret
- Provide configuration for wrangler.jsonc

After running, manually add the environment variables
to your wrangler.jsonc file as instructed.
"