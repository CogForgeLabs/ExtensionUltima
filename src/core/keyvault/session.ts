// Session key cache. Holds the Data Encryption Key in `storage.session`, which is kept in
// RAM by the browser and never written to disk, and is cleared when the browser closes.
//
// This lets an evicted/restarted service worker resume automations within the same browsing
// session WITHOUT re-prompting for the passphrase — while still honoring "only decrypted in
// memory" (storage.session is memory). On browser restart the cache is gone and the vault
// requires the passphrase again. Access is restricted to trusted extension contexts so
// content scripts cannot read the key.
import browser from '../browser';

const KEY = 'eu:session:dek';

interface SessionArea {
  get(keys: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string): Promise<void>;
  setAccessLevel?(opts: { accessLevel: string }): Promise<void>;
}

function area(): SessionArea | null {
  const s = (browser.storage as unknown as { session?: SessionArea }).session;
  return s ?? null;
}

export class SessionKeyCache {
  /** Restrict the session area to trusted contexts (no content scripts). Best-effort. */
  async init(): Promise<void> {
    try {
      await area()?.setAccessLevel?.({ accessLevel: 'TRUSTED_CONTEXTS' });
    } catch {
      /* not supported (e.g. Firefox) — session area is already extension-only */
    }
  }

  async save(dekRawB64: string): Promise<void> {
    try {
      await area()?.set({ [KEY]: dekRawB64 });
    } catch {
      /* unavailable — degrade to passphrase-on-resume */
    }
  }

  async load(): Promise<string | null> {
    try {
      const r = await area()?.get(KEY);
      return (r?.[KEY] as string | undefined) ?? null;
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      await area()?.remove(KEY);
    } catch {
      /* ignore */
    }
  }
}
