import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

function getKey(): Buffer {
  const raw = process.env.INTEGRATIONS_ENCRYPTION_KEY
  if (!raw) {
    throw new Error('INTEGRATIONS_ENCRYPTION_KEY is not set — refusing to encrypt/decrypt tokens without it.')
  }
  // Accept a 64-char hex string (32 bytes) directly; anything else is derived via scrypt
  // so operators can't accidentally use a too-short/weak key.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex')
  }
  return scryptSync(raw, 'integrations-encryption-salt', 32)
}

/** Encrypts a plaintext secret (e.g. an OAuth token) into `iv:authTag:ciphertext`, all hex. */
export function encryptSecret(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`
}

/** Reverses {@link encryptSecret}. Throws if the payload was tampered with or the key is wrong. */
export function decryptSecret(encrypted: string): string {
  const key = getKey()
  const [ivHex, authTagHex, ciphertextHex] = encrypted.split(':')
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error('Malformed encrypted secret — expected "iv:authTag:ciphertext" hex triplet.')
  }
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertextHex, 'hex')), decipher.final()])
  return plaintext.toString('utf8')
}
