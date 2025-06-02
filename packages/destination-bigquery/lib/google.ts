import { getAccessToken } from '@maccman/web-auth-library/google'
import type { BigQueryEnv } from './env'

// Generate a short lived access token from the service account key credentials

async function getAccessTokenForEnv(env: BigQueryEnv): Promise<string> {
  return getAccessToken({
    credentials: env.GOOGLE_CLOUD_CREDENTIALS,
    scope: 'https://www.googleapis.com/auth/bigquery',
  })
}

export async function getCachedAccessTokenForEnv(env: BigQueryEnv): Promise<string> {
  const cachedToken = await env.tokenCache.get('access_token')

  if (cachedToken) {
    return cachedToken
  }

  const accessToken = await getAccessTokenForEnv(env)

  await env.tokenCache.put('access_token', accessToken, { expirationTtl: 3600 })

  return accessToken
} 