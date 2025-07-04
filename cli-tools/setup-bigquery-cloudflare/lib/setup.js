import chalk from 'chalk';

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

export async function setupBigQuery(config) {
  const headers = {
    'Authorization': `Bearer ${config.apiToken}`,
    'Content-Type': 'application/json'
  };

  // Environment variables to set
  const envVars = {
    'BIGQUERY_PROJECT_ID': config.projectId,
    'BIGQUERY_DATASET_ID': config.datasetId
  };

  // Service account key always stored as secret
  const secrets = {
    'BIGQUERY_SERVICE_ACCOUNT_KEY': config.serviceAccountKey
  };

  try {
    // First, check if the worker exists
    const workerUrl = `${CLOUDFLARE_API_BASE}/accounts/${config.accountId}/workers/scripts/${config.workerName}`;
    const checkResponse = await fetch(workerUrl, {
      method: 'GET',
      headers
    });

    if (!checkResponse.ok && checkResponse.status !== 404) {
      const error = await checkResponse.json();
      throw new Error(`Failed to check worker: ${error.errors?.[0]?.message || 'Unknown error'}`);
    }

    const workerExists = checkResponse.ok;

    // Set environment variables
    console.log(chalk.gray('\n📝 Setting environment variables...'));
    
    for (const [key, value] of Object.entries(envVars)) {
      console.log(chalk.gray(`   - ${key}`));
    }

    const envVarsPayload = {
      vars: envVars
    };

    const envVarsUrl = `${CLOUDFLARE_API_BASE}/accounts/${config.accountId}/workers/scripts/${config.workerName}/settings`;
    
    // If worker doesn't exist, we'll just prepare the config
    if (!workerExists) {
      console.log(chalk.yellow('\n⚠️  Worker does not exist yet.'));
      console.log(chalk.yellow('Configuration will be applied when you deploy the worker.'));
      
      // Generate wrangler.toml content
      generateWranglerConfig(config, envVars, secrets);
      return;
    }

    // Update environment variables
    const envResponse = await fetch(envVarsUrl, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(envVarsPayload)
    });

    if (!envResponse.ok) {
      const error = await envResponse.json();
      throw new Error(`Failed to set environment variables: ${error.errors?.[0]?.message || 'Unknown error'}`);
    }

    // Create secrets
    console.log(chalk.gray('\n🔐 Creating secrets...'));
    
    for (const [secretName, secretValue] of Object.entries(secrets)) {
      console.log(chalk.gray(`   - ${secretName}`));
      
      const secretUrl = `${CLOUDFLARE_API_BASE}/accounts/${config.accountId}/workers/scripts/${config.workerName}/secrets`;
      const secretResponse = await fetch(secretUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: secretName,
          text: secretValue,
          type: 'secret_text'
        })
      });

      if (!secretResponse.ok) {
        const error = await secretResponse.json();
        throw new Error(`Failed to create secret ${secretName}: ${error.errors?.[0]?.message || 'Unknown error'}`);
      }
    }

    console.log(chalk.green('\n✅ Configuration successfully applied!'));

  } catch (error) {
    if (error.message.includes('Invalid Access Token')) {
      throw new Error('Invalid Cloudflare API Token. Please check your credentials.');
    }
    throw error;
  }
}

function generateWranglerConfig(config, envVars, secrets) {
  console.log(chalk.blue('\n📄 Generated wrangler.toml configuration:'));
  console.log(chalk.gray('─'.repeat(60)));
  
  const wranglerConfig = `name = "${config.workerName}"
main = "src/index.js"
compatibility_date = "2024-01-01"
account_id = "${config.accountId}"

[vars]
${Object.entries(envVars).map(([key, value]) => `${key} = "${value}"`).join('\n')}

# Run this command to set the service account key secret:
# wrangler secret put BIGQUERY_SERVICE_ACCOUNT_KEY < service-account-key.json
`;

  console.log(wranglerConfig);
  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.yellow('\n💡 Save this configuration to wrangler.toml in your worker directory'));
  console.log(chalk.yellow('💡 Save your service account key to service-account-key.json and run the secret command'));
}