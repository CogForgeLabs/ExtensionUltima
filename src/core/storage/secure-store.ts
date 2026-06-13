// Encrypted storage (Rule 2 in CLAUDE.md). All values are encrypted via the CryptoEngine
// before they touch browser.storage. Logical key NAMES are also kept off disk in plaintext:
// they live inside an encrypted index, and on-disk record keys are opaque random ids.
//
// Namespacing: each module gets its own SecureStore namespace, so one module cannot read
// another's records (least privilege).
import browser from '../browser';
import type { CryptoEngine } from '../crypto/engine';
import type { EncryptedBlob } from '../crypto/types';
import { randomId } from '../crypto/codec';

type Index = Record<string, string>; // logicalKey -> opaque record id

export class SecureStore {
  private readonly prefix: string;

  constructor(
    private readonly engine: CryptoEngine,
    namespace: string,
  ) {
    this.prefix = `eu:${namespace}`;
  }

  private get indexKey(): string {
    return `${this.prefix}:idx`;
  }

  private recKey(id: string): string {
    return `${this.prefix}:rec:${id}`;
  }

  private async loadIndex(): Promise<Index> {
    const raw = await browser.storage.local.get(this.indexKey);
    const blob = raw[this.indexKey] as EncryptedBlob | undefined;
    if (!blob) return {};
    return this.engine.decryptJson<Index>(blob);
  }

  private async saveIndex(idx: Index): Promise<void> {
    const blob = await this.engine.encryptJson(idx);
    await browser.storage.local.set({ [this.indexKey]: blob });
  }

  async get<T = unknown>(key: string): Promise<T | undefined> {
    const idx = await this.loadIndex();
    const id = idx[key];
    if (!id) return undefined;
    const raw = await browser.storage.local.get(this.recKey(id));
    const blob = raw[this.recKey(id)] as EncryptedBlob | undefined;
    if (!blob) return undefined;
    return this.engine.decryptJson<T>(blob);
  }

  async put(key: string, value: unknown): Promise<void> {
    const idx = await this.loadIndex();
    let id = idx[key];
    if (!id) {
      id = randomId();
      idx[key] = id;
      await this.saveIndex(idx);
    }
    const blob = await this.engine.encryptJson(value);
    await browser.storage.local.set({ [this.recKey(id)]: blob });
  }

  async delete(key: string): Promise<void> {
    const idx = await this.loadIndex();
    const id = idx[key];
    if (!id) return;
    delete idx[key];
    await this.saveIndex(idx);
    await browser.storage.local.remove(this.recKey(id));
  }

  async keys(): Promise<string[]> {
    return Object.keys(await this.loadIndex());
  }
}
