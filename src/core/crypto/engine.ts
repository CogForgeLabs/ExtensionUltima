// The global encryption engine (Rule 2 in CLAUDE.md).
// Every module encrypts/decrypts through an instance of this — no module rolls its own
// crypto. Holds the in-memory, non-extractable Data Encryption Key (DEK).
import type { EncryptedBlob } from './types';
import { fromBase64, randomBytes, toBase64, utf8 } from './codec';

const IV_LENGTH = 12; // 96-bit IV, recommended for AES-GCM
const ENVELOPE_VERSION = 1;

export class CryptoEngine {
  /** @param dek In-memory AES-GCM key. Should be non-extractable. */
  constructor(private readonly dek: CryptoKey) {}

  async encrypt(data: BufferSource): Promise<EncryptedBlob> {
    const iv = randomBytes(IV_LENGTH);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, this.dek, data);
    return { v: ENVELOPE_VERSION, iv: toBase64(iv), ct: toBase64(ct) };
  }

  async decrypt(blob: EncryptedBlob): Promise<Uint8Array> {
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(blob.iv) },
      this.dek,
      fromBase64(blob.ct),
    );
    return new Uint8Array(pt);
  }

  async encryptJson(value: unknown): Promise<EncryptedBlob> {
    return this.encrypt(utf8.encode(JSON.stringify(value)));
  }

  async decryptJson<T = unknown>(blob: EncryptedBlob): Promise<T> {
    return JSON.parse(utf8.decode(await this.decrypt(blob))) as T;
  }
}
