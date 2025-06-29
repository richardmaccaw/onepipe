import { v4 as uuid } from 'uuid'

/**
 * Generate a secure setup token
 */
export function generateSetupToken(): string {
  return uuid()
}

