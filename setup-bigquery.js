#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import readline from 'readline';

const KV_BINDING = "KV_BINDING"; // Hardcoded from wrangler.jsonc

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🚀 OnePipe BigQuery Setup Tool

Usage: node setup-bigquery.js [options]

This interactive tool helps you configure BigQuery for your OnePipe instance.

Options:
  -h, --help    Show this help message

What it does:
• Prompts for BigQuery project ID and dataset ID
• Uploads Google Cloud service account credentials to Cloudflare Secrets
• Stores project/dataset IDs in Cloudflare KV (non-sensitive config)
• Updates onepipe-configuration.json automatically

Requirements:
• Google Cloud project with BigQuery enabled
• Service account with BigQuery Data Editor permissions
• Service account JSON key file
• wrangler CLI authenticated (run: wrangler auth login)

Example:
  pnpm run setup:bigquery
  node setup-bigquery.js
`);
  process.exit(0);
}

console.log(`
🚀 OnePipe BigQuery Setup
========================

This tool will help you configure BigQuery for your OnePipe instance.
We'll set up the required secrets and validate your configuration.

Required information:
- Google Cloud service account credentials (JSON file)
- BigQuery project ID 
- BigQuery dataset ID

Let's get started!
`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function validateProjectId(projectId) {
  const regex = /^[a-z]([a-z0-9-]){4,28}[a-z0-9]$/;
  return regex.test(projectId);
}

function validateDatasetId(datasetId) {
  const regex = /^[a-zA-Z0-9_]+$/;
  return regex.test(datasetId) && datasetId.length <= 1024;
}

async function main() {
  try {
    // Step 1: Get BigQuery Project ID
    let projectId;
    while (true) {
      projectId = await question('\n📋 Enter your BigQuery Project ID: ');
      if (validateProjectId(projectId)) {
        break;
      }
      console.log('❌ Invalid project ID format. Project IDs must be 6-30 characters, start with a letter, and contain only lowercase letters, numbers, and hyphens.');
    }

    // Step 2: Get BigQuery Dataset ID
    let datasetId;
    while (true) {
      datasetId = await question('\n📊 Enter your BigQuery Dataset ID: ');
      if (validateDatasetId(datasetId)) {
        break;
      }
      console.log('❌ Invalid dataset ID format. Dataset IDs can contain letters, numbers, and underscores only.');
    }

    // Step 3: Get service account credentials
    let credentialsPath;
    while (true) {
      credentialsPath = await question('\n🔑 Enter the path to your Google Cloud service account JSON file: ');
      try {
        const credentials = readFileSync(credentialsPath, 'utf8');
        JSON.parse(credentials); // Validate it's valid JSON
        break;
      } catch (error) {
        console.log('❌ Could not read or parse the credentials file. Please check the path and ensure it\'s a valid JSON file.');
      }
    }

    console.log('\n⚙️  Setting up BigQuery configuration...\n');

    // Step 4: Set Cloudflare secrets and KV values
    console.log('📤 Setting Cloudflare Worker configuration...');
    
    // Read and encode credentials
    const credentials = readFileSync(credentialsPath, 'utf8');
    const encodedCredentials = Buffer.from(credentials).toString('base64');

    // Set sensitive credential as secret
    try {
      console.log('  → Setting GOOGLE_CLOUD_CREDENTIALS (secret)...');
      execSync(`echo "${encodedCredentials}" | wrangler secret put GOOGLE_CLOUD_CREDENTIALS`, { stdio: 'pipe' });
      
    } catch (error) {
      console.error('❌ Error setting secrets. Make sure you have wrangler installed and are authenticated.');
      console.error('Run: wrangler auth login');
      process.exit(1);
    }

    // Set non-sensitive configuration in KV as metadata
    try {
      console.log('  → Setting BigQuery configuration (KV metadata)...');
      const kvData = JSON.stringify({ 
        configured: true, 
        timestamp: new Date().toISOString() 
      });
      const metadata = JSON.stringify({
        BIGQUERY_PROJECT_ID: projectId,
        BIGQUERY_DATASET_ID: datasetId
      });
      
      execSync(`wrangler kv key put --binding=${KV_BINDING} "destination-bigquery" '${kvData}' --metadata='${metadata}'`, { stdio: 'pipe' });
      
    } catch (error) {
      console.error('❌ Error setting KV values. Make sure you have wrangler installed and are authenticated.');
      console.error('Run: wrangler auth login');
      process.exit(1);
    }

    // Step 5: Update configuration file
    console.log('\n📝 Updating onepipe-configuration.json...');
    
    try {
      const configPath = './onepipe-configuration.json';
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      
      // Check if bigquery destination already exists
      const existingBigQuery = config.destinations?.find(d => d.name === 'bigquery');
      
      if (!existingBigQuery) {
        if (!config.destinations) config.destinations = [];
        config.destinations.push({
          name: 'bigquery',
          package: '@onepipe/destination-bigquery',
          options: {}
        });
        
        writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('  ✅ Added BigQuery destination to configuration');
      } else {
        console.log('  ✅ BigQuery destination already configured');
      }
      
    } catch (error) {
      console.log('  ⚠️  Could not update configuration file. You may need to manually add the BigQuery destination.');
    }

    // Step 6: Display summary
    console.log(`
🎉 BigQuery Setup Complete!
==========================

Configuration Summary:
• Project ID: ${projectId} (stored in KV)
• Dataset ID: ${datasetId} (stored in KV)
• Service Account: ✅ Credentials stored in Cloudflare Secrets
• KV Binding: ${KV_BINDING}

Storage Details:
• GOOGLE_CLOUD_CREDENTIALS → Cloudflare Worker Secret (sensitive)
• BIGQUERY_PROJECT_ID → KV: ${KV_BINDING}/destination-bigquery metadata (non-sensitive)
• BIGQUERY_DATASET_ID → KV: ${KV_BINDING}/destination-bigquery metadata (non-sensitive)

Next Steps:
1. Make sure your BigQuery dataset exists in Google Cloud Console
2. Verify your service account has BigQuery Data Editor permissions
3. Test your setup by deploying: pnpm run deploy
4. Send a test event to verify BigQuery integration

Useful Commands:
• Deploy worker: pnpm run deploy
• View logs: wrangler tail
• List secrets: wrangler secret list
• List KV keys: wrangler kv key list --binding=${KV_BINDING}
• View BigQuery config: wrangler kv key get --binding=${KV_BINDING} "destination-bigquery" --metadata

Happy data pipelining! 🚀
`);

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Setup cancelled. Run this script again when you\'re ready!');
  rl.close();
  process.exit(0);
});

main();