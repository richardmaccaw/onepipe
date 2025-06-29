/**
 * Simple encryption utilities for storing sensitive setup data
 * Uses Web Crypto API available in Cloudflare Workers
 */

// Generate a key from setup token for encryption
async function generateKey(setupToken: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  
  // Use the full setup token as key material without truncation
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(setupToken),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
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
  const encoder = new TextEncoder()
  
  // Generate random salt and IV for each encryption
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  
  const key = await generateKey(setupToken, salt)
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  )
  
  // Combine salt, IV, and encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(encrypted), salt.length + iv.length)
  
  // Use proper base64 encoding
  const base64 = btoa(String.fromCharCode(...combined))
  return base64
}

/**
 * Decrypt sensitive data using setup token as key material
 */
export async function decryptData(encryptedData: string, setupToken: string): Promise<string> {
  try {
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    )
    
    // Extract salt, IV, and encrypted data
    const salt = combined.slice(0, 16)
    const iv = combined.slice(16, 28)
    const encrypted = combined.slice(28)
    
    const key = await generateKey(setupToken, salt)
    
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