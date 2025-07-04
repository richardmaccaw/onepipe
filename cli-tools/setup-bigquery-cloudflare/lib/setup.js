import chalk from 'chalk';
import { writeFileSync, unlinkSync } from 'fs';
import { runCommand } from './utils.js';
import path from 'path';

export async function setupBigQuery(config) {
  const configData = {
    'BIGQUERY_PROJECT_ID': config.projectId,
    'BIGQUERY_DATASET_ID': config.datasetId
  };

  try {
    // Check if wrangler.jsonc exists
    console.log(chalk.gray('\n🔍 Checking for wrangler configuration...'));
    const configCheck = runCommand('ls wrangler.jsonc', { silent: true });
    
    if (!configCheck.success) {
      console.log(chalk.yellow('\n⚠️  No wrangler.jsonc found in current directory'));
      console.log(chalk.yellow('Please run this command from your worker directory'));
      throw new Error('wrangler.jsonc not found');
    }

    console.log(chalk.green('✓ Found wrangler.jsonc'));

    // Handle different storage methods
    switch (config.storageMethod) {
      case 'vars':
        await setupWithVars(configData, config);
        break;
      case 'secrets':
        await setupWithSecrets(configData, config);
        break;
      case 'kv':
        await setupWithKV(configData, config);
        break;
    }

    console.log(chalk.green('\n✅ Configuration complete!'));
    
  } catch (error) {
    if (error.message.includes('wrangler.jsonc not found')) {
      throw error;
    }
    throw new Error(`Setup failed: ${error.message}`);
  }
}

async function setupWithVars(configData, config) {
  console.log(chalk.blue('\n📝 Setting up with Environment Variables'));
  
  // Store service account key as secret
  await storeServiceAccountKeyAsSecret(config.serviceAccountKey);

  // Show instructions for manual configuration
  console.log(chalk.blue('\n📋 Manual Configuration Required:'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.yellow('\nAdd these environment variables to your wrangler.jsonc:'));
  console.log(chalk.cyan('\n{'));
  console.log(chalk.cyan('  "vars": {'));
  for (const [key, value] of Object.entries(configData)) {
    console.log(chalk.cyan(`    "${key}": "${value}",`));
  }
  console.log(chalk.cyan('    // ... other vars'));
  console.log(chalk.cyan('  }'));
  console.log(chalk.cyan('}'));
  console.log(chalk.gray('─'.repeat(60)));
  
  console.log(chalk.gray('\nThe service account key has been stored as a Cloudflare secret.'));
  console.log(chalk.gray('Don\'t forget to update your wrangler.jsonc with the environment variables above.'));
}

async function setupWithSecrets(configData, config) {
  console.log(chalk.blue('\n🔐 Setting up with Secrets'));
  
  // Store all configuration as secrets
  for (const [key, value] of Object.entries(configData)) {
    console.log(chalk.gray(`\nSetting secret ${key}...`));
    
    const tempFile = path.join(process.cwd(), `.temp-${key}.txt`);
    try {
      writeFileSync(tempFile, value, 'utf8');
      const command = `wrangler secret put ${key} < ${tempFile}`;
      const result = runCommand(command);
      
      if (!result.success) {
        throw new Error(`Failed to set secret ${key}: ${result.error}`);
      }
      console.log(chalk.green(`✓ Secret ${key} stored`));
    } finally {
      try {
        unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
  
  // Store service account key as secret
  await storeServiceAccountKeyAsSecret(config.serviceAccountKey);
  
  console.log(chalk.gray('\n✅ All configuration stored as secrets'));
  console.log(chalk.gray('Access these in your worker using:'));
  console.log(chalk.cyan('  env.BIGQUERY_PROJECT_ID'));
  console.log(chalk.cyan('  env.BIGQUERY_DATASET_ID'));
  console.log(chalk.cyan('  env.BIGQUERY_SERVICE_ACCOUNT_KEY'));
}

async function setupWithKV(configData, config) {
  console.log(chalk.blue(`\n📦 Setting up with KV Namespace: ${config.kvNamespace}`));
  
  // Store configuration in KV
  const kvConfig = {
    projectId: config.projectId,
    datasetId: config.datasetId,
    serviceAccountKey: JSON.parse(config.serviceAccountKey)
  };
  
  console.log(chalk.gray('\nStoring configuration in KV namespace...'));
  
  const tempFile = path.join(process.cwd(), '.temp-kv-config.json');
  try {
    writeFileSync(tempFile, JSON.stringify(kvConfig, null, 2), 'utf8');
    
    const command = `wrangler kv:key put --binding=${config.kvNamespace} "bigquery-config" --path=${tempFile}`;
    console.log(chalk.gray('Running: wrangler kv:key put'));
    
    const result = runCommand(command);
    
    if (!result.success) {
      throw new Error(`Failed to store KV configuration: ${result.error}`);
    }
    
    console.log(chalk.green('✓ Configuration stored in KV namespace'));
  } finally {
    try {
      unlinkSync(tempFile);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
  
  console.log(chalk.gray('\n✅ Configuration stored in KV namespace'));
  console.log(chalk.gray('Access this in your worker using:'));
  console.log(chalk.cyan(`  const config = await env.${config.kvNamespace}.get('bigquery-config', 'json')`));
}

async function storeServiceAccountKeyAsSecret(serviceAccountKey) {
  console.log(chalk.gray('\n🔐 Setting service account key as secret...'));
  
  const tempFile = path.join(process.cwd(), '.temp-service-account-key.json');
  
  try {
    writeFileSync(tempFile, serviceAccountKey, 'utf8');
    
    const secretCommand = `wrangler secret put BIGQUERY_SERVICE_ACCOUNT_KEY < ${tempFile}`;
    console.log(chalk.gray('Running: wrangler secret put BIGQUERY_SERVICE_ACCOUNT_KEY'));
    
    const result = runCommand(secretCommand);
    
    if (!result.success) {
      throw new Error(`Failed to set secret: ${result.error}`);
    }
    
    console.log(chalk.green('✓ Service account key stored as secret'));
    
  } finally {
    try {
      unlinkSync(tempFile);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}