// Wire/at-rest shapes for the crypto layer. These are the ONLY forms in which data is
// allowed to touch disk — every field is ciphertext or non-secret parameters.

/** AES-GCM ciphertext envelope. `ct` includes the GCM auth tag. */
export interface EncryptedBlob {
  /** Envelope format version. */
  v: number;
  /** Base64 initialization vector (random per encryption). */
  iv: string;
  /** Base64 ciphertext + auth tag. */
  ct: string;
}

/** Non-secret vault metadata stored in plaintext (safe: contains no key material). */
export interface VaultMetadata {
  v: number;
  kdf: 'PBKDF2';
  hash: 'SHA-256';
  iterations: number;
  /** Base64 KDF salt. */
  salt: string;
  /** Data Encryption Key, wrapped by the passphrase-derived Key Encryption Key. */
  wrappedDek: EncryptedBlob;
  /** Encryption of a known constant, used to verify the passphrase on unlock. */
  verifier: EncryptedBlob;
}
