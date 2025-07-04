/**
 * Demo Cloudflare Worker showing how to access BigQuery configuration
 * stored using the setup-bigquery-cloudflare tool
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Determine which storage method to demonstrate
    const storageMethod = url.searchParams.get('method') || 'vars';
    
    try {
      let config;
      
      switch (storageMethod) {
        case 'vars':
          // Method 1: Environment variables + secret
          config = {
            projectId: env.BIGQUERY_PROJECT_ID,
            datasetId: env.BIGQUERY_DATASET_ID,
            serviceAccountKey: env.BIGQUERY_SERVICE_ACCOUNT_KEY
          };
          break;
          
        case 'secrets':
          // Method 2: All stored as secrets
          config = {
            projectId: env.BIGQUERY_PROJECT_ID,
            datasetId: env.BIGQUERY_DATASET_ID,
            serviceAccountKey: env.BIGQUERY_SERVICE_ACCOUNT_KEY
          };
          break;
          
        case 'kv':
          // Method 3: Stored in KV namespace
          // Assumes you have a KV namespace bound as CONFIG_KV
          if (!env.CONFIG_KV) {
            throw new Error('KV namespace CONFIG_KV not found');
          }
          config = await env.CONFIG_KV.get('bigquery-config', 'json');
          if (!config) {
            throw new Error('BigQuery config not found in KV');
          }
          break;
          
        default:
          throw new Error('Invalid storage method');
      }
      
      // Validate configuration
      if (!config.projectId || !config.datasetId || !config.serviceAccountKey) {
        throw new Error('Incomplete BigQuery configuration');
      }
      
      // Parse service account key if it's a string
      let serviceAccountKey = config.serviceAccountKey;
      if (typeof serviceAccountKey === 'string') {
        try {
          serviceAccountKey = JSON.parse(serviceAccountKey);
        } catch (e) {
          // Already parsed or invalid
        }
      }
      
      // Here you would initialize your BigQuery client
      // For demo purposes, we'll just return the config info
      return new Response(JSON.stringify({
        success: true,
        storageMethod,
        config: {
          projectId: config.projectId,
          datasetId: config.datasetId,
          hasServiceAccountKey: !!serviceAccountKey,
          serviceAccountEmail: serviceAccountKey?.client_email || 'not found'
        }
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        storageMethod
      }, null, 2), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * Example BigQuery client initialization (pseudo-code):
 * 
 * import { BigQuery } from '@google-cloud/bigquery';
 * 
 * function initBigQuery(config) {
 *   const serviceAccountKey = typeof config.serviceAccountKey === 'string' 
 *     ? JSON.parse(config.serviceAccountKey) 
 *     : config.serviceAccountKey;
 *     
 *   return new BigQuery({
 *     projectId: config.projectId,
 *     credentials: serviceAccountKey
 *   });
 * }
 * 
 * const bigquery = initBigQuery(config);
 * const dataset = bigquery.dataset(config.datasetId);
 */