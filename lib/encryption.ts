import crypto from 'crypto'

// The initialization vector length for AES-GCM is 16 bytes
const IV_LENGTH = 16

/**
 * Validates and retrieves the encryption key from the environment.
 * Expects ENCRYPTION_KEY to be a 32-byte (64-character) hex string.
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set.')
  }
  
  const buffer = Buffer.from(key, 'hex')
  if (buffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters) for AES-256.')
  }
  
  return buffer
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns both the ciphertext and the initialization vector (IV).
 * The auth tag is appended to the end of the ciphertext.
 */
export function encryptNote(text: string): { encryptedContent: string; iv: string } {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  // Get the authentication tag and append it to the ciphertext
  const authTag = cipher.getAuthTag().toString('hex')
  
  return {
    encryptedContent: encrypted + ':' + authTag,
    iv: iv.toString('hex')
  }
}

/**
 * Decrypts a ciphertext string using AES-256-GCM and the provided IV.
 * Expects the encrypted content to have the auth tag appended (format: ciphertext:authtag).
 */
export function decryptNote(encryptedText: string, ivHex: string): string {
  const key = getEncryptionKey()
  const iv = Buffer.from(ivHex, 'hex')
  
  // Split the ciphertext and the auth tag
  const parts = encryptedText.split(':')
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted content format.')
  }
  
  const [encrypted, authTagHex] = parts
  const authTag = Buffer.from(authTagHex, 'hex')
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
