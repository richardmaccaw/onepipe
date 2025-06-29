import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { zValidator } from '@hono/zod-validator'
import { v4 as uuid } from 'uuid'
import type { Env } from './types'
import { trackEventSchema, identifyEventSchema, pageEventSchema } from '@onepipe/core'
import type { TrackEvent, IdentifyEvent, PageEvent, TrackSystemEvent, IdentifySystemEvent, QueueMessage } from '@onepipe/core'
import { safeConsumeMessage } from './queue/consumer'
import { validateSetupToken, extractSetupToken } from './setup/token'
import { getOAuthConfig, exchangeCodeForTokens, storeOAuthTokens, getOAuthTokens, getGoogleProjects, getBigQueryDatasets } from './setup/oauth'

const app = new Hono()

// Apply CORS middleware globally
app.use('*', cors({
  origin: '*',
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}))

app.get('/', (c) => {
  const env = c.env as Env
  
  // If in setup mode, redirect to setup page
  if (env.SETUP_MODE === 'true') {
    return c.redirect('/setup')
  }

  return c.html(`
    <h1>onepipe</h1>

    <p>
      This is a <a href="https://developers.cloudflare.com/workers/">Cloudflare Worker</a> that receives Segment events and sends them to <a href="https://cloud.google.com/bigquery">BigQuery</a>.
    </p>

    <hr />

    <button 
      onclick="fetch('/track', { method: 'POST', 
        body: JSON.stringify({ type: 'track', userId: '123', event: 'my_test_event', anonymousId: '000', properties: { my_property: 'test' } }),
        headers:  { 'Content-Type': 'application/json' }
      })">
      Trigger track event
    </button>
  `)
})

// Setup mode routes
app.get('/setup', (c) => {
  const env = c.env as Env
  
  if (env.SETUP_MODE !== 'true') {
    return c.html('<h1>Setup not available</h1><p>This worker is not in setup mode.</p>', 404)
  }

  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>OnePipe Setup</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        .destination-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .destination-card h3 { margin-top: 0; }
        button { background: #0066cc; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; }
        button:hover { background: #0052a3; }
        .setup-token { background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; }
      </style>
    </head>
    <body>
      <h1>🚀 Welcome to OnePipe</h1>
      <p>Your OnePipe worker has been deployed successfully! Now let's configure your destinations.</p>
      
      <div class="setup-token">
        <strong>Setup Token:</strong> ${env.SETUP_TOKEN || 'Not set'}
      </div>

      <h2>Available Destinations</h2>
      
      <div class="destination-card">
        <h3>📊 Google BigQuery</h3>
        <p>Send your analytics events to Google BigQuery for powerful data analysis and reporting.</p>
        <button onclick="configureDestination('bigquery')">Configure BigQuery</button>
      </div>

      <div class="destination-card">
        <h3>🔧 Coming Soon</h3>
        <p>More destinations like Snowflake, PostgreSQL, and Webhook will be available soon.</p>
        <button disabled>Stay Tuned</button>
      </div>

      <script>
        function configureDestination(type) {
          if (type === 'bigquery') {
            window.location.href = '/auth/google?destination=bigquery&state=${env.SETUP_TOKEN}';
          }
        }
      </script>
    </body>
    </html>
  `)
})

// OAuth authentication routes
app.get('/auth/google', (c) => {
  const env = c.env as Env
  
  if (env.SETUP_MODE !== 'true') {
    return c.json({ error: 'Setup not available' }, 404)
  }

  const destination = c.req.query('destination')
  const state = c.req.query('state')
  
  if (!validateSetupToken(env, state)) {
    return c.json({ error: 'Invalid setup token' }, 403)
  }

  // Get OAuth configuration
  const oauthConfig = getOAuthConfig(env, c.req.url)
  
  if (!oauthConfig.clientId || !oauthConfig.clientSecret) {
    return c.html(`
      <h1>OAuth Configuration Missing</h1>
      <p>Google OAuth client credentials are not configured. Please set:</p>
      <ul>
        <li>GOOGLE_OAUTH_CLIENT_ID</li>
        <li>GOOGLE_OAUTH_CLIENT_SECRET</li>
      </ul>
      <p><a href="/setup">Back to Setup</a></p>
    `)
  }

  const scope = 'https://www.googleapis.com/auth/bigquery https://www.googleapis.com/auth/cloud-platform.read-only'
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', oauthConfig.clientId)
  authUrl.searchParams.set('redirect_uri', oauthConfig.redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scope)
  authUrl.searchParams.set('state', JSON.stringify({ setupToken: state, destination }))
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')

  return c.redirect(authUrl.toString())
})

// OAuth callback route
app.get('/callback/google', async (c) => {
  const env = c.env as Env
  
  if (env.SETUP_MODE !== 'true') {
    return c.json({ error: 'Setup not available' }, 404)
  }

  const code = c.req.query('code')
  const state = c.req.query('state')
  const error = c.req.query('error')

  if (error) {
    return c.html(`
      <h1>Authentication Failed</h1>
      <p>Error: ${error}</p>
      <p><a href="/setup">Back to Setup</a></p>
    `)
  }

  if (!code || !state) {
    return c.html(`
      <h1>Authentication Failed</h1>
      <p>Missing authorization code or state parameter.</p>
      <p><a href="/setup">Back to Setup</a></p>
    `)
  }

  try {
    const stateData = JSON.parse(state)
    
    if (!validateSetupToken(env, stateData.setupToken)) {
      return c.json({ error: 'Invalid setup token' }, 403)
    }

    // Exchange code for tokens
    const oauthConfig = getOAuthConfig(env, c.req.url)
    
    try {
      const tokens = await exchangeCodeForTokens(code, oauthConfig)
      await storeOAuthTokens(env, stateData.setupToken, tokens)
      
      return c.html(`
        <h1>🎉 Authentication Successful!</h1>
        <p>Your Google account has been connected successfully.</p>
        <p>Next step: Configure your BigQuery project and dataset.</p>
        <p><a href="/configure?token=${stateData.setupToken}&destination=${stateData.destination}">Continue Setup</a></p>
      `)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return c.html(`
        <h1>Authentication Failed</h1>
        <p>Failed to exchange authorization code: ${errorMessage}</p>
        <p><a href="/setup">Back to Setup</a></p>
      `)
    }
  } catch (err) {
    return c.html(`
      <h1>Authentication Failed</h1>
      <p>Invalid state parameter.</p>
      <p><a href="/setup">Back to Setup</a></p>
    `)
  }
})

// Configuration route
app.get('/configure', async (c) => {
  const env = c.env as Env
  
  if (env.SETUP_MODE !== 'true') {
    return c.json({ error: 'Setup not available' }, 404)
  }

  const token = c.req.query('token')
  const destination = c.req.query('destination')
  
  if (!validateSetupToken(env, token)) {
    return c.json({ error: 'Invalid setup token' }, 403)
  }

  if (destination === 'bigquery') {
    // Try to get OAuth tokens and fetch projects/datasets
    const oauthTokens = await getOAuthTokens(env, token!)
    let projectsOptions = ''
    let datasetsOptions = ''
    
    if (oauthTokens?.accessToken) {
      try {
        const projects = await getGoogleProjects(oauthTokens.accessToken)
        projectsOptions = projects.map(p => 
          `<option value="${p.projectId}">${p.name} (${p.projectId})</option>`
        ).join('')
      } catch (error) {
        console.log('Failed to fetch projects:', error)
      }
    }

    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Configure BigQuery</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
          .form-group { margin: 20px 0; }
          label { display: block; margin-bottom: 5px; font-weight: 500; }
          input, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
          button { background: #0066cc; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; }
          button:hover { background: #0052a3; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 10px; border-radius: 4px; }
          .loading { color: #666; font-style: italic; }
        </style>
      </head>
      <body>
        <h1>📊 Configure BigQuery</h1>
        <p>Configure your BigQuery destination to start receiving events.</p>
        
        <form id="configForm">
          <div class="form-group">
            <label for="projectId">Google Cloud Project</label>
            ${projectsOptions ? 
              `<select id="projectId" name="projectId" required onchange="loadDatasets()">
                <option value="">Select a project...</option>
                ${projectsOptions}
               </select>` :
              `<input type="text" id="projectId" name="projectId" required placeholder="my-gcp-project">
               <small>Enter your Google Cloud Project ID manually</small>`
            }
          </div>
          
          <div class="form-group">
            <label for="datasetId">BigQuery Dataset</label>
            <select id="datasetId" name="datasetId" required>
              <option value="">Select a project first...</option>
            </select>
            <small>Or create a new dataset: <input type="text" id="newDatasetId" placeholder="e.g., analytics" style="width: auto; margin-left: 10px;"></small>
          </div>
          
          <button type="submit">Complete Setup</button>
        </form>

        <script>
          const token = '${token}';
          
          async function loadDatasets() {
            const projectId = document.getElementById('projectId').value;
            const datasetSelect = document.getElementById('datasetId');
            
            if (!projectId) {
              datasetSelect.innerHTML = '<option value="">Select a project first...</option>';
              return;
            }
            
            datasetSelect.innerHTML = '<option value="" class="loading">Loading datasets...</option>';
            
            try {
              const response = await fetch(\`/api/datasets?token=\${token}&projectId=\${projectId}\`);
              const datasets = await response.json();
              
              datasetSelect.innerHTML = '<option value="">Select a dataset...</option>';
              datasets.forEach(dataset => {
                datasetSelect.innerHTML += \`<option value="\${dataset.id}">\${dataset.friendlyName || dataset.id}</option>\`;
              });
            } catch (err) {
              datasetSelect.innerHTML = '<option value="">Failed to load datasets</option>';
            }
          }
          
          document.getElementById('configForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            let datasetId = formData.get('datasetId');
            const newDatasetId = formData.get('newDatasetId') || document.getElementById('newDatasetId').value;
            
            // Use new dataset ID if provided
            if (newDatasetId && !datasetId) {
              datasetId = newDatasetId;
            }
            
            const config = {
              destination: '${destination}',
              token: '${token}',
              projectId: formData.get('projectId'),
              datasetId: datasetId
            };
            
            try {
              const response = await fetch('/api/configure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
              });
              
              if (response.ok) {
                document.body.innerHTML = '<div class="success"><h1>🎉 Setup Complete!</h1><p>Your OnePipe worker is now configured and ready to receive events.</p><p><a href="/">Go to Dashboard</a></p></div>';
              } else {
                const error = await response.text();
                alert('Configuration failed: ' + error);
              }
            } catch (err) {
              alert('Configuration failed: ' + err.message);
            }
          });
        </script>
      </body>
      </html>
    `)
  }

  return c.json({ error: 'Unknown destination' }, 400)
})

// Configuration API endpoint
app.post('/api/configure', async (c) => {
  const env = c.env as Env
  
  if (env.SETUP_MODE !== 'true') {
    return c.json({ error: 'Setup not available' }, 404)
  }

  const body = await c.req.json()
  const { token, destination, projectId, datasetId } = body
  
  if (!validateSetupToken(env, token)) {
    return c.json({ error: 'Invalid setup token' }, 403)
  }

  // TODO: Update worker configuration via Cloudflare API
  // For now, just return success
  return c.json({ 
    success: true, 
    message: 'Configuration saved. Please update your environment variables and redeploy.',
    config: {
      BIGQUERY_PROJECT_ID: projectId,
      BIGQUERY_DATASET_ID: datasetId,
      SETUP_MODE: 'false'
    }
  })
})

// API endpoint to fetch BigQuery datasets for a project
app.get('/api/datasets', async (c) => {
  const env = c.env as Env
  
  if (env.SETUP_MODE !== 'true') {
    return c.json({ error: 'Setup not available' }, 404)
  }

  const token = c.req.query('token')
  const projectId = c.req.query('projectId')
  
  if (!validateSetupToken(env, token)) {
    return c.json({ error: 'Invalid setup token' }, 403)
  }

  if (!projectId) {
    return c.json({ error: 'Project ID is required' }, 400)
  }

  try {
    // Get OAuth tokens
    const oauthTokens = await getOAuthTokens(env, token!)
    
    if (!oauthTokens?.accessToken) {
      return c.json({ error: 'No authentication token found' }, 401)
    }

    // Fetch datasets for the project
    const datasets = await getBigQueryDatasets(oauthTokens.accessToken, projectId)
    return c.json(datasets)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: `Failed to fetch datasets: ${errorMessage}` }, 500)
  }
})

app.post('/track', zValidator('json', trackEventSchema), async (c) => {
  const data = c.req.valid('json')
  const env = c.env as Env
  
  // Block event processing in setup mode
  if (env.SETUP_MODE === 'true') {
    return c.json({ error: 'Worker is in setup mode. Please complete setup first.' }, 503)
  }

  const timestamp = new Date()

  const event: TrackSystemEvent = {
    ...data,
    id: uuid(),
    timestamp: data.timestamp || timestamp,
    loadedAt: timestamp,
    receivedAt: timestamp,
    sentAt: timestamp,
  }

  await env.QUEUE.send({
    type: 'track',
    event,
  })

  return c.json({ ok: true })
})

app.post('/identify', zValidator('json', identifyEventSchema), async (c) => {
  const data = c.req.valid('json')
  const env = c.env as Env
  
  // Block event processing in setup mode
  if (env.SETUP_MODE === 'true') {
    return c.json({ error: 'Worker is in setup mode. Please complete setup first.' }, 503)
  }

  const timestamp = new Date()

  const event: IdentifySystemEvent = {
    ...data,
    id: uuid(),
    timestamp: data.timestamp || timestamp,
    loadedAt: timestamp,
    receivedAt: timestamp,
    sentAt: timestamp,
  }

  await env.QUEUE.send({
    type: 'identify',
    event,
  })

  return c.json({ ok: true })
})

app.post('/page', zValidator('json', pageEventSchema), async (c) => {
  const data = c.req.valid('json')
  const env = c.env as Env
  
  // Block event processing in setup mode
  if (env.SETUP_MODE === 'true') {
    return c.json({ error: 'Worker is in setup mode. Please complete setup first.' }, 503)
  }

  const timestamp = new Date()

  const event: TrackSystemEvent = {
    ...data,
    type: 'track',
    event: 'page',
    id: uuid(),
    timestamp: data.timestamp || timestamp,
    loadedAt: timestamp,
    receivedAt: timestamp,
    sentAt: timestamp,
    properties: {
      ...data.properties,
      name: data.name,
      category: data.category,
    },
  }

  await env.QUEUE.send({
    type: 'track',
    event,
  })

  return c.json({ ok: true })
})

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx)
  },

  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      await safeConsumeMessage(message, env)
    }
  },
}
