import crypto from 'crypto'

/**
 * Generate a secure random token for return actions
 * @returns {string} A secure random token (32 bytes as hex = 64 characters)
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Hash a token for storage (additional security layer)
 * Not used currently, but available if needed
 * @param {string} token - The token to hash
 * @returns {string} SHA256 hash of the token
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Generate token expiration date (7 days from now)
 * @returns {Date} Expiration date
 */
export function getTokenExpiration(): Date {
  const expirationDate = new Date()
  expirationDate.setDate(expirationDate.getDate() + 7) // 7 days
  return expirationDate
}
