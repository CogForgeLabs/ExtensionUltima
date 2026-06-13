// Clipboard Manager — keeps an encrypted history of text you copy on pages.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { installCopyCatcher } from './inject';

interface Entry {
  id: string;
  text: string;
  at: number;
}
const MAX = 50;

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'clipboard-manager',
    name: 'Clipboard Manager',
    version: '0.1.0',
    description: 'Encrypted history of text you copy; paste it back any time.',
    icon: '📋',
    keywords: ['clipboard', 'copy', 'history', 'paste', 'snippets'],
    category: 'Utilities',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs', 'scripting', 'storage'],
  },

  init(c) {
    ctx = c;
    ctx.tabs.onComplete(async (tabId) => {
      try {
        await ctx.tabs.runFunc(tabId, installCopyCatcher, []);
      } catch {
        /* ignore */
      }
    });
    ctx.log.info('initialized');
  },

  commands: {
    async add(p: { text: string }) {
      if (!p.text?.trim()) return { ok: false };
      const list = await load();
      if (list[0]?.text === p.text) return { ok: true }; // dedupe consecutive
      list.unshift({ id: randomId(), text: p.text, at: Date.now() });
      await ctx.storage.put('history', list.slice(0, MAX));
      return { ok: true };
    },
    async list() {
      return await load();
    },
    async remove(p: { id: string }) {
      await ctx.storage.put('history', (await load()).filter((e) => e.id !== p.id));
      return { ok: true };
    },
    async clear() {
      await ctx.storage.put('history', []);
      return { ok: true };
    },
    async status() {
      const n = (await load()).length;
      return { active: n > 0, summary: n ? `${n} clip(s)` : '' };
    },
  },
};

async function load(): Promise<Entry[]> {
  return (await ctx.storage.get<Entry[]>('history')) ?? [];
}

function randomId(): string {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

export default mod;
