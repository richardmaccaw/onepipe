#!/usr/bin/env node

/**
 * OnePipe Deployment Script
 * 
 * This script handles the complete deployment of OnePipe including:
 * 1. Creating required Cloudflare infrastructure (KV, Queue)
 * 2. Generating setup tokens and configuration
 * 3. Deploying the worker in setup mode
 */

const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configuration
const RANDOM_ID = crypto.randomBytes(4).toString('hex');
const SETUP_TOKEN = crypto.randomUUID();

console.log('🚀 Deploying OnePipe...');
console.log(`Random ID: ${RANDOM_ID}`);
console.log(`Setup Token: ${SETUP_TOKEN}`);

// Step 1: Create KV namespace
console.log('\n📦 Creating KV namespace...');
try {
  const kvResult = execSync(`wrangler kv:namespace create "TOKEN_CACHE" --preview`, { encoding: 'utf8' });
  console.log(kvResult);
  
  // Extract KV namespace IDs from output
  const kvIdMatch = kvResult.match(/id = "([^"]+)"/);
  const kvPreviewIdMatch = kvResult.match(/preview_id = "([^"]+)"/);
  
  if (!kvIdMatch || !kvPreviewIdMatch) {
    throw new Error('Failed to extract KV namespace IDs');
  }
  
  const TOKEN_CACHE_ID = kvIdMatch[1];
  const TOKEN_CACHE_PREVIEW_ID = kvPreviewIdMatch[1];
  
  console.log(`✅ KV namespace created: ${TOKEN_CACHE_ID}`);
  
  // Step 2: Create Queue
  console.log('\n📮 Creating Queue...');
  const queueResult = execSync(`wrangler queues create onepipe-queue-${RANDOM_ID}`, { encoding: 'utf8' });
  console.log(queueResult);
  console.log(`✅ Queue created: onepipe-queue-${RANDOM_ID}`);
  
  // Step 3: Generate wrangler.toml from template
  console.log('\n📝 Generating configuration...');
  const templatePath = path.join(__dirname, 'wrangler.toml');
  const template = fs.readFileSync(templatePath, 'utf8');
  
  // Get OAuth credentials from environment (optional for now)
  const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || 'NOT_SET';
  const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || 'NOT_SET';
  
  if (GOOGLE_OAUTH_CLIENT_ID === 'NOT_SET' || GOOGLE_OAUTH_CLIENT_SECRET === 'NOT_SET') {
    console.log('\n⚠️  Google OAuth credentials not found in environment variables.');
    console.log('You can configure them later in the Cloudflare Workers dashboard or set them now:');
    console.log('- GOOGLE_OAUTH_CLIENT_ID');
    console.log('- GOOGLE_OAUTH_CLIENT_SECRET');
    console.log('\nGet credentials at: https://console.cloud.google.com/apis/credentials');
  }
  
  // Replace template variables
  const config = template
    .replace(/\${RANDOM_ID}/g, RANDOM_ID)
    .replace(/\${SETUP_TOKEN}/g, SETUP_TOKEN)
    .replace(/\${TOKEN_CACHE_ID}/g, TOKEN_CACHE_ID)
    .replace(/\${TOKEN_CACHE_PREVIEW_ID}/g, TOKEN_CACHE_PREVIEW_ID)
    .replace(/\${GOOGLE_OAUTH_CLIENT_ID}/g, GOOGLE_OAUTH_CLIENT_ID)
    .replace(/\${GOOGLE_OAUTH_CLIENT_SECRET}/g, GOOGLE_OAUTH_CLIENT_SECRET);
  
  // Write final wrangler.toml
  fs.writeFileSync('wrangler.toml', config);
  console.log('✅ Configuration generated');
  
  // Step 4: Deploy worker
  console.log('\n🚀 Deploying worker...');
  const deployResult = execSync('wrangler deploy', { encoding: 'utf8' });
  console.log(deployResult);
  
  // Extract worker URL from deploy output
  const urlMatch = deployResult.match(/https:\/\/[^\s]+/);
  const workerUrl = urlMatch ? urlMatch[0] : `https://onepipe-${RANDOM_ID}.YOUR_SUBDOMAIN.workers.dev`;
  
  console.log('\n🎉 Deployment complete!');
  console.log(`Worker URL: ${workerUrl}`);
  console.log(`Setup URL: ${workerUrl}/setup?token=${SETUP_TOKEN}`);
  console.log('\nNext steps:');
  console.log('1. Visit the setup URL to configure your destinations');
  console.log('2. Complete the OAuth flow for your chosen destinations');
  console.log('3. Your analytics pipeline will be ready to receive events!');
  
  // Save deployment info for later reference
  const deploymentInfo = {
    randomId: RANDOM_ID,
    setupToken: SETUP_TOKEN,
    workerUrl,
    setupUrl: `${workerUrl}/setup?token=${SETUP_TOKEN}`,
    kvNamespaceId: TOKEN_CACHE_ID,
    queueName: `onepipe-queue-${RANDOM_ID}`,
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
  console.log('\n📋 Deployment info saved to deployment-info.json');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.error('\nTroubleshooting:');
  console.error('1. Make sure you have wrangler installed and authenticated');
  console.error('2. Check that you have the necessary Cloudflare permissions');
  console.error('3. Verify your Google OAuth credentials are configured');
  process.exit(1);
}