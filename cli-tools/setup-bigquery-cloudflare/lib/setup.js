import chalk from 'chalk';
import { writeFileSync, unlinkSync } from 'fs';
import { runCommand } from './utils.js';
import path from 'path';

export async function setupBigQuery(config) {
  // Environment variables to set
  const envVars = {
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

    // Set environment variables
    console.log(chalk.gray('\n📝 Setting environment variables...'));
    
    for (const [key, value] of Object.entries(envVars)) {
      console.log(chalk.gray(`   Setting ${key}...`));
      const command = `wrangler secret put ${key}`;
      
      // For non-secret env vars, we'll use a different approach
      // First, let's check if we can use wrangler.toml approach
      console.log(chalk.yellow(`   Note: ${key} should be added to your wrangler.jsonc vars section`));
    }

    // Store service account key as secret
    console.log(chalk.gray('\n🔐 Setting service account key as secret...'));
    
    // Create a temporary file for the service account key
    const tempFile = path.join(process.cwd(), '.temp-service-account-key.json');
    
    try {
      // Write service account key to temp file
      writeFileSync(tempFile, config.serviceAccountKey, 'utf8');
      
      // Use wrangler to set the secret
      const secretCommand = `wrangler secret put BIGQUERY_SERVICE_ACCOUNT_KEY < ${tempFile}`;
      console.log(chalk.gray('   Running: wrangler secret put BIGQUERY_SERVICE_ACCOUNT_KEY'));
      
      const result = runCommand(secretCommand);
      
      if (!result.success) {
        throw new Error(`Failed to set secret: ${result.error}`);
      }
      
      console.log(chalk.green('✓ Service account key stored as secret'));
      
    } finally {
      // Clean up temp file
      try {
        unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    // Show instructions for manual configuration
    console.log(chalk.blue('\n📋 Manual Configuration Required:'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.yellow('\nAdd these environment variables to your wrangler.jsonc:'));
    console.log(chalk.cyan('\n{'));
    console.log(chalk.cyan('  "vars": {'));
    for (const [key, value] of Object.entries(envVars)) {
      console.log(chalk.cyan(`    "${key}": "${value}",`));
    }
    console.log(chalk.cyan('    // ... other vars'));
    console.log(chalk.cyan('  }'));
    console.log(chalk.cyan('}'));
    console.log(chalk.gray('─'.repeat(60)));

    console.log(chalk.green('\n✅ Secret configuration complete!'));
    console.log(chalk.gray('\nThe service account key has been stored as a Cloudflare secret.'));
    console.log(chalk.gray('Don\'t forget to update your wrangler.jsonc with the environment variables above.'));

  } catch (error) {
    if (error.message.includes('wrangler.jsonc not found')) {
      throw error;
    }
    throw new Error(`Wrangler command failed: ${error.message}`);
  }
}