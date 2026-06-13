// A set of "active" tab ids backed by the encrypted store, so per-tab page effects (reader
// overlay, auto-scroll, etc.) survive a service-worker eviction and still appear in the
// Activity dashboard. Resilient to the locked state — storage errors are swallowed.
import type { SecureStore } from './secure-store';

export class PersistentTabSet {
  private ids = new Set<number>();
  private loaded = false;

  constructor(
    private readonly store: SecureStore,
    private readonly key = 'activeTabs',
  ) {}

  private async ensure(): Promise<void> {
    if (this.loaded) return;
    try {
      this.ids = new Set((await this.store.get<number[]>(this.key)) ?? []);
      this.loaded = true;
    } catch {
      /* vault locked or store unavailable — retry on next access */
    }
  }

  private async persist(): Promise<void> {
    try {
      await this.store.put(this.key, [...this.ids]);
    } catch {
      /* ignore */
    }
  }

  async add(tabId: number): Promise<void> {
    await this.ensure();
    this.ids.add(tabId);
    await this.persist();
  }

  async delete(tabId: number): Promise<void> {
    await this.ensure();
    if (this.ids.delete(tabId)) await this.persist();
  }

  async all(): Promise<number[]> {
    await this.ensure();
    return [...this.ids];
  }

  /** Drop ids whose tab is no longer open (e.g. closed while the worker was evicted). */
  async prune(openTabIds: Set<number>): Promise<number[]> {
    await this.ensure();
    let changed = false;
    for (const id of [...this.ids]) {
      if (!openTabIds.has(id)) {
        this.ids.delete(id);
        changed = true;
      }
    }
    if (changed) await this.persist();
    return [...this.ids];
  }
}
