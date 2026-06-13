// Key vault: owns the master-key lifecycle. Implements envelope encryption —
// a random Data Encryption Key (DEK) encrypts all data; the DEK is wrapped by a
// passphrase-derived Key Encryption Key (KEK). The DEK lives in memory only while
// unlocked, as a non-extractable key. (Rule 2 in CLAUDE.md.)
//
// To survive service-worker eviction within a browsing session, the raw DEK is also held
// in `storage.session` (RAM, never disk, cleared on browser close) — see session.ts.
// `tryRehydrate()` restores the engine from that cache without the passphrase.
import browser from '../browser';
import { CryptoEngine } from '../crypto/engine';
import { DEFAULT_ITERATIONS, deriveKek, newSalt } from '../crypto/kdf';
import type { EncryptedBlob, VaultMetadata } from '../crypto/types';
import { fromBase64, randomBytes, toBase64, utf8 } from '../crypto/codec';
import { SessionKeyCache } from './session';

const META_KEY = 'eu:vault:meta';
const VERIFIER_PLAINTEXT = 'ExtensionUltima/verifier/v1';

export class KeyVault {
  private engine: CryptoEngine | null = null;
  readonly session = new SessionKeyCache();

  get isUnlocked(): boolean {
    return this.engine !== null;
  }

  get crypto(): CryptoEngine {
    if (!this.engine) throw new Error('Vault is locked');
    return this.engine;
  }

  async isInitialized(): Promise<boolean> {
    const r = await browser.storage.local.get(META_KEY);
    return Boolean(r[META_KEY]);
  }

  private async readMeta(): Promise<VaultMetadata | null> {
    const r = await browser.storage.local.get(META_KEY);
    return (r[META_KEY] as VaultMetadata | undefined) ?? null;
  }

  /** First-run: create the vault (generate DEK, wrap it under the passphrase). */
  async setup(passphrase: string): Promise<void> {
    if (await this.isInitialized()) throw new Error('Vault already initialized');
    await this.session.init();

    const salt = newSalt();
    const iterations = DEFAULT_ITERATIONS;
    const kek = await deriveKek(passphrase, salt, iterations);

    // Extractable only long enough to wrap + seed the engine; the in-memory key is
    // re-imported non-extractable below.
    const dek = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
      'encrypt',
      'decrypt',
    ]);

    const wrapIv = randomBytes(12);
    const wrapped = await crypto.subtle.wrapKey('raw', dek, kek, { name: 'AES-GCM', iv: wrapIv });
    const wrappedDek: EncryptedBlob = { v: 1, iv: toBase64(wrapIv), ct: toBase64(wrapped) };

    const vIv = randomBytes(12);
    const vCt = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: vIv },
      dek,
      utf8.encode(VERIFIER_PLAINTEXT),
    );
    const verifier: EncryptedBlob = { v: 1, iv: toBase64(vIv), ct: toBase64(vCt) };

    const meta: VaultMetadata = {
      v: 1,
      kdf: 'PBKDF2',
      hash: 'SHA-256',
      iterations,
      salt,
      wrappedDek,
      verifier,
    };
    await browser.storage.local.set({ [META_KEY]: meta });

    await this.adopt(dek);
  }

  /** Unlock an existing vault. Throws 'Incorrect passphrase' on failure. */
  async unlock(passphrase: string): Promise<void> {
    await this.session.init();
    const meta = await this.readMeta();
    if (!meta) throw new Error('Vault not initialized');

    const kek = await deriveKek(passphrase, meta.salt, meta.iterations);

    let dek: CryptoKey;
    try {
      // Extractable so we can seed the session cache; re-imported non-extractable in adopt().
      dek = await crypto.subtle.unwrapKey(
        'raw',
        fromBase64(meta.wrappedDek.ct),
        kek,
        { name: 'AES-GCM', iv: fromBase64(meta.wrappedDek.iv) },
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt'],
      );
    } catch {
      throw new Error('Incorrect passphrase');
    }

    const probe = new CryptoEngine(dek);
    try {
      if (utf8.decode(await probe.decrypt(meta.verifier)) !== VERIFIER_PLAINTEXT) {
        throw new Error('verifier mismatch');
      }
    } catch {
      throw new Error('Incorrect passphrase');
    }

    await this.adopt(dek);
  }

  /** Resume from the in-RAM session key cache (no passphrase). Returns whether it worked. */
  async tryRehydrate(): Promise<boolean> {
    await this.session.init();
    const rawB64 = await this.session.load();
    if (!rawB64) return false;
    try {
      const dek = await crypto.subtle.importKey('raw', fromBase64(rawB64), { name: 'AES-GCM' }, false, [
        'encrypt',
        'decrypt',
      ]);
      this.engine = new CryptoEngine(dek);
      return true;
    } catch {
      await this.session.clear();
      return false;
    }
  }

  /** Discard the in-memory key and the session cache. Reopening requires the passphrase. */
  async lock(): Promise<void> {
    this.engine = null;
    await this.session.clear();
  }

  /** Cache the raw DEK in session RAM, then hold a non-extractable copy as the engine key. */
  private async adopt(extractableDek: CryptoKey): Promise<void> {
    const raw = await crypto.subtle.exportKey('raw', extractableDek);
    await this.session.save(toBase64(raw));
    const nonExtractable = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
      'encrypt',
      'decrypt',
    ]);
    this.engine = new CryptoEngine(nonExtractable);
  }
}
