#!/usr/bin/env node

import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { setupBigQuery } from './lib/setup.js';
import { validateConfig } from './lib/validate.js';
import { checkWranglerInstalled } from './lib/utils.js';

program
  .version('1.0.0')
  .description('CLI tool to configure BigQuery destination settings using Wrangler')
  .option('-i, --interactive', 'Run in interactive mode (default)', true)
  .option('-c, --config <path>', 'Path to configuration file')
  .parse(process.argv);

const options = program.opts();

async function main() {
  console.log(chalk.blue.bold('\n🚀 BigQuery Wrangler Setup Tool\n'));

  try {
    // Check if wrangler is installed
    const wranglerCheck = await checkWranglerInstalled();
    if (!wranglerCheck.installed) {
      console.log(chalk.red('❌ Wrangler CLI is not installed'));
      console.log(chalk.yellow('\nPlease install wrangler first:'));
      console.log(chalk.cyan('  npm install -g wrangler'));
      console.log(chalk.cyan('  # or'));
      console.log(chalk.cyan('  pnpm add -g wrangler\n'));
      process.exit(1);
    }

    console.log(chalk.green('✓ Wrangler CLI found:'), chalk.gray(wranglerCheck.version));

    let config;
    
    if (options.config) {
      // Load config from file (future enhancement)
      console.log(chalk.yellow('Config file support coming soon...'));
      process.exit(1);
    } else {
      // Interactive mode
      config = await promptForConfig();
    }

    // Validate configuration
    const validation = validateConfig(config);
    if (!validation.valid) {
      console.log(chalk.red('❌ Configuration validation failed:'));
      validation.errors.forEach(err => console.log(chalk.red(`  - ${err}`)));
      process.exit(1);
    }

    // Setup BigQuery using wrangler
    const spinner = ora('Setting up BigQuery configuration with Wrangler...').start();
    
    try {
      await setupBigQuery(config);
      spinner.succeed('BigQuery configuration successfully set up!');
      
      console.log(chalk.green('\n✅ Setup complete!'));
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray('  1. Deploy your worker: wrangler deploy'));
      console.log(chalk.gray('  2. Test the BigQuery connection'));
      console.log(chalk.gray('  3. Start sending data to BigQuery\n'));
    } catch (error) {
      spinner.fail('Failed to setup BigQuery configuration');
      throw error;
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  }
}

async function promptForConfig() {
  console.log(chalk.gray('Please provide your BigQuery configuration:\n'));
  console.log(chalk.yellow('ℹ️  This tool assumes you have a wrangler.jsonc file in the current directory'));
  console.log(chalk.yellow('   and are already authenticated with Cloudflare via wrangler login\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectId',
      message: 'BigQuery Project ID:',
      validate: input => input.length > 0 || 'Project ID is required'
    },
    {
      type: 'input',
      name: 'datasetId',
      message: 'BigQuery Dataset ID:',
      validate: input => input.length > 0 || 'Dataset ID is required'
    },
    {
      type: 'editor',
      name: 'serviceAccountKey',
      message: 'Paste your BigQuery Service Account Key JSON (opens editor):',
      validate: input => {
        try {
          JSON.parse(input);
          return true;
        } catch {
          return 'Invalid JSON format';
        }
      }
    },
    {
      type: 'confirm',
      name: 'confirmSetup',
      message: 'Ready to set up environment variables and secrets?',
      default: true
    }
  ]);

  if (!answers.confirmSetup) {
    console.log(chalk.yellow('\nSetup cancelled.'));
    process.exit(0);
  }

  return answers;
}

main().catch(console.error);