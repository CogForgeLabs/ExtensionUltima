// Sticky Notes — draggable notes pinned to a page, saved (encrypted) per URL and restored on
// revisit. The page sends edits/moves back via chrome.runtime (handled by the module dispatch).
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { renderNotes } from './inject';

interface Note {
  id: string;
  x: number;
  y: number;
  text: string;
}
type Store = Record<string, Note[]>;

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'sticky-notes',
    name: 'Sticky Notes',
    version: '0.1.0',
    description: 'Pin draggable notes to a page, saved per URL.',
    icon: '🗒️',
    keywords: ['sticky', 'note', 'annotate', 'page note', 'memo'],
    category: 'Page',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs', 'scripting', 'storage'],
  },

  init(c) {
    ctx = c;
    ctx.tabs.onComplete(async (tabId, url) => {
      const notes = (await load())[url];
      if (notes?.length) {
        try {
          await ctx.tabs.runFunc(tabId, renderNotes, [url, notes]);
        } catch {
          /* ignore */
        }
      }
    });
    ctx.log.info('initialized');
  },

  commands: {
    async add() {
      const tab = await ctx.tabs.activeTab();
      if (!tab) throw new Error('No active tab');
      const store = await load();
      const notes = store[tab.url] ?? [];
      notes.push({ id: randomId(), x: 60, y: 60, text: 'New note' });
      store[tab.url] = notes;
      await ctx.storage.put('store', store);
      try {
        await ctx.tabs.runFunc(tab.id, renderNotes, [tab.url, notes]);
      } catch {
        /* ignore */
      }
      return { ok: true };
    },
    async update(p: { url: string; id: string; text: string }) {
      await mutate(p.url, (notes) => notes.map((n) => (n.id === p.id ? { ...n, text: p.text } : n)));
      return { ok: true };
    },
    async move(p: { url: string; id: string; x: number; y: number }) {
      await mutate(p.url, (notes) => notes.map((n) => (n.id === p.id ? { ...n, x: p.x, y: p.y } : n)));
      return { ok: true };
    },
    async remove(p: { url: string; id: string }) {
      await mutate(p.url, (notes) => notes.filter((n) => n.id !== p.id));
      return { ok: true };
    },
    async status() {
      const total = Object.values(await load()).reduce((a, b) => a + b.length, 0);
      return { active: total > 0, summary: total ? `${total} sticky note(s)` : '' };
    },
    async activity() {
      const store = await load();
      return Object.keys(store)
        .filter((u) => store[u].length)
        .map((u) => ({ id: u, label: `${store[u].length} note(s) · ${hostOf(u)}`, scope: { kind: 'url', pattern: u }, stoppable: true }));
    },
    async stopActivity(p: { id: string }) {
      const store = await load();
      delete store[p.id];
      await ctx.storage.put('store', store);
      for (const t of await ctx.tabs.allTabs()) {
        if (t.url === p.id) {
          try {
            await ctx.tabs.reload(t.id);
          } catch {
            /* ignore */
          }
        }
      }
      return { ok: true };
    },
  },
};

async function mutate(url: string, fn: (n: Note[]) => Note[]): Promise<void> {
  const store = await load();
  store[url] = fn(store[url] ?? []);
  await ctx.storage.put('store', store);
}

async function load(): Promise<Store> {
  return (await ctx.storage.get<Store>('store')) ?? {};
}

function randomId(): string {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default mod;
