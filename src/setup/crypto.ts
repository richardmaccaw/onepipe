/**
 * Simple encryption utilities for storing sensitive setup data
 * Uses Web Crypto API available in Cloudflare Workers
 */

// Generate a key from setup token for encryption
async function generateKey(setupToken: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(setupToken.slice(0, 32).padEnd(32, '0')),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('onepipe-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt sensitive data using setup token as key material
 */
export async function encryptData(data: string, setupToken: string): Promise<string> {
  const key = await generateKey(setupToken)
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  )
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  
  // Return base64 encoded
  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt sensitive data using setup token as key material
 */
export async function decryptData(encryptedData: string, setupToken: string): Promise<string> {
  try {
    const key = await generateKey(setupToken)
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    )
    
    const iv = combined.slice(0, 12)
    const encrypted = combined.slice(12)
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    )
    
    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch (error) {
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Securely store OAuth tokens with encryption
 */
export async function storeEncryptedTokens(
  env: { TOKEN_CACHE: KVNamespace },
  setupToken: string,
  tokens: any
): Promise<void> {
  const encrypted = await encryptData(JSON.stringify(tokens), setupToken)
  const key = `oauth:${setupToken}`
  
  // Store for 24 hours (setup should complete within this time)
  await env.TOKEN_CACHE.put(key, encrypted, { expirationTtl: 86400 })
}

/**
 * Retrieve and decrypt OAuth tokens
 */
export async function getEncryptedTokens(
  env: { TOKEN_CACHE: KVNamespace },
  setupToken: string
): Promise<any | null> {
  const key = `oauth:${setupToken}`
  const encrypted = await env.TOKEN_CACHE.get(key)
  
  if (!encrypted) {
    return null
  }
  
  try {
    const decrypted = await decryptData(encrypted, setupToken)
    return JSON.parse(decrypted)
  } catch (error) {
    // If decryption fails, token might be corrupted or tampered with
    return null
  }
}