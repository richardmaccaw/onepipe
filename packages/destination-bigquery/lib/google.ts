import { getAccessToken } from '@maccman/web-auth-library/google'
import type { BigQueryEnv } from './types'

async function getAccessTokenForEnv(env: BigQueryEnv): Promise<string> {
  return getAccessToken({
    credentials: env.GOOGLE_CLOUD_CREDENTIALS,
    scope: 'https://www.googleapis.com/auth/bigquery',
  })
}

export async function getCachedAccessTokenForEnv(env: BigQueryEnv): Promise<string> {
  const cacheKey = 'bigquery:access_token'
  const cachedToken = await env.KV_BINDING.get(cacheKey)

  if (cachedToken) {
    return cachedToken
  }

  const accessToken = await getAccessTokenForEnv(env)

  await env.KV_BINDING.put(cacheKey, accessToken, { expirationTtl: 3600 })

  return accessToken
} 