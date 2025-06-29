import { v4 as uuid } from 'uuid'

/**
 * Generate a secure setup token
 */
export function generateSetupToken(): string {
  return uuid()
}

/**
 * Validate setup token from request
 */
export function validateSetupToken(env: any, providedToken?: string): boolean {
  if (!env.SETUP_TOKEN) {
    return false
  }
  
  if (!providedToken) {
    return false
  }
  
  return env.SETUP_TOKEN === providedToken
}

/**
 * Extract setup token from URL parameters or headers
 */
export function extractSetupToken(request: Request): string | null {
  const url = new URL(request.url)
  
  // Check URL parameter first
  const tokenFromUrl = url.searchParams.get('token') || url.searchParams.get('state')
  if (tokenFromUrl) {
    return tokenFromUrl
  }
  
  // Check Authorization header
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  return null
}