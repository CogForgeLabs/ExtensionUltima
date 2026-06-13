// Launcher preferences: pinned modules and per-module usage counts. Stored encrypted
// in a core namespace (Rule 2) so the launcher can show pinned + most-used ordering.
import type { Core } from '../core';

const NS = 'core:prefs';

export class Prefs {
  constructor(private readonly core: Core) {}

  private store() {
    return this.core.storageFor(NS);
  }

  async pins(): Promise<string[]> {
    return (await this.store().get<string[]>('pins')) ?? [];
  }

  async usage(): Promise<Record<string, number>> {
    return (await this.store().get<Record<string, number>>('usage')) ?? {};
  }

  async lastUsed(): Promise<Record<string, number>> {
    return (await this.store().get<Record<string, number>>('lastUsed')) ?? {};
  }

  async recordLaunch(id: string): Promise<void> {
    const usage = await this.usage();
    usage[id] = (usage[id] ?? 0) + 1;
    await this.store().put('usage', usage);
    const lastUsed = await this.lastUsed();
    lastUsed[id] = Date.now();
    await this.store().put('lastUsed', lastUsed);
  }

  async togglePin(id: string): Promise<string[]> {
    const pins = await this.pins();
    const i = pins.indexOf(id);
    if (i >= 0) pins.splice(i, 1);
    else pins.push(id);
    await this.store().put('pins', pins);
    return pins;
  }
}
