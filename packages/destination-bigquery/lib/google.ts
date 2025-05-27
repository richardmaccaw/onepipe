import { getAccessToken } from '@maccman/web-auth-library/google'
import type { Env } from '@onepipe/core'

// Generate a short lived access token from the service account key credentials

async function getAccessTokenForEnv(env: Env): Promise<string> {
  return getAccessToken({
    credentials: env.GOOGLE_CLOUD_CREDENTIALS,
    scope: 'https://www.googleapis.com/auth/bigquery',
  })
}

export async function getCachedAccessTokenForEnv(env: Env): Promise<string> {
  const cachedToken = await env.GOOGLE_TOKENS.get('access_token')

  if (cachedToken) {
    return cachedToken
  }

  const accessToken = await getAccessTokenForEnv(env)

  await env.GOOGLE_TOKENS.put('access_token', accessToken, { expirationTtl: 3600 })

  return accessToken
} 