#!/usr/bin/env node

import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { setupBigQuery } from './lib/setup.js';
import { validateConfig } from './lib/validate.js';

program
  .version('1.0.0')
  .description('CLI tool to configure BigQuery destination settings in Cloudflare')
  .option('-i, --interactive', 'Run in interactive mode (default)', true)
  .option('-c, --config <path>', 'Path to configuration file')
  .parse(process.argv);

const options = program.opts();

async function main() {
  console.log(chalk.blue.bold('\n🚀 BigQuery Cloudflare Setup Tool\n'));

  try {
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

    // Setup BigQuery in Cloudflare
    const spinner = ora('Setting up BigQuery configuration in Cloudflare...').start();
    
    try {
      await setupBigQuery(config);
      spinner.succeed('BigQuery configuration successfully set up in Cloudflare!');
      
      console.log(chalk.green('\n✅ Setup complete!'));
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray('  1. Deploy your Cloudflare Worker'));
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
  console.log(chalk.gray('Please provide your BigQuery and Cloudflare configuration:\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'accountId',
      message: 'Cloudflare Account ID:',
      validate: input => input.length > 0 || 'Account ID is required'
    },
    {
      type: 'input',
      name: 'apiToken',
      message: 'Cloudflare API Token:',
      validate: input => input.length > 0 || 'API Token is required',
      mask: '*'
    },
    {
      type: 'input',
      name: 'workerName',
      message: 'Worker Name:',
      default: 'bigquery-destination',
      validate: input => input.length > 0 || 'Worker name is required'
    },
    {
      type: 'separator',
      line: chalk.gray('─'.repeat(50))
    },
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
    }
  ]);

  return answers;
}

main().catch(console.error);