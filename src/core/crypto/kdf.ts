// Key derivation: turn a user passphrase into a Key Encryption Key (KEK).
// Uses WebCrypto PBKDF2 (native, no WASM). Argon2id is the planned upgrade path —
// see README "Security roadmap".
import { fromBase64, randomBytes, toBase64, utf8 } from './codec';

export const DEFAULT_ITERATIONS = 600_000;

export function newSalt(): string {
  return toBase64(randomBytes(16));
}

/**
 * Derive a non-extractable AES-GCM KEK from a passphrase. The KEK only ever wraps/unwraps
 * the DEK; it never encrypts user data directly and is never persisted.
 */
export async function deriveKek(
  passphrase: string,
  saltB64: string,
  iterations: number,
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    utf8.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromBase64(saltB64), iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey'],
  );
}
