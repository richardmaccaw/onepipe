import type { Env } from '../types'

export interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

export interface GoogleProject {
  projectId: string
  name: string
  projectNumber: string
}

export interface GoogleDataset {
  id: string
  friendlyName?: string
  description?: string
}

/**
 * Exchange OAuth authorization code for access and refresh tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  config: OAuthConfig
): Promise<GoogleTokenResponse> {
  const tokenUrl = 'https://oauth2.googleapis.com/token'
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${error}`)
  }

  return response.json()
}

/**
 * Get user's Google Cloud projects
 */
export async function getGoogleProjects(accessToken: string): Promise<GoogleProject[]> {
  const response = await fetch(
    'https://cloudresourcemanager.googleapis.com/v1/projects',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Google Cloud projects')
  }

  const data = await response.json() as { projects?: GoogleProject[] }
  return data.projects || []
}

/**
 * Get BigQuery datasets for a project
 */
export async function getBigQueryDatasets(
  accessToken: string,
  projectId: string
): Promise<GoogleDataset[]> {
  const response = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch BigQuery datasets')
  }

  const data = await response.json() as { datasets?: any[] }
  return data.datasets?.map((ds: any) => ({
    id: ds.datasetReference.datasetId,
    friendlyName: ds.friendlyName,
    description: ds.description,
  })) || []
}

/**
 * Store OAuth tokens securely in KV storage with encryption
 */
export async function storeOAuthTokens(
  env: Env,
  setupToken: string,
  tokens: GoogleTokenResponse
): Promise<void> {
  const value = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + (tokens.expires_in * 1000),
    tokenType: tokens.token_type,
    scope: tokens.scope,
  }

  // Use encrypted storage from crypto module
  const { storeEncryptedTokens } = await import('./crypto')
  await storeEncryptedTokens(env, setupToken, value)
}

/**
 * Retrieve OAuth tokens from KV storage with decryption
 */
export async function getOAuthTokens(
  env: Env,
  setupToken: string
): Promise<any | null> {
  // Use encrypted storage from crypto module
  const { getEncryptedTokens } = await import('./crypto')
  return getEncryptedTokens(env, setupToken)
}

/**
 * Get OAuth configuration from environment
 */
export function getOAuthConfig(env: Env, baseUrl: string): OAuthConfig {
  return {
    clientId: env.GOOGLE_OAUTH_CLIENT_ID || '',
    clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    redirectUri: new URL('/callback/google', baseUrl).toString(),
  }
}