// Web Highlighter — highlight text on a page; highlights are saved (encrypted) per URL and
// restored when you revisit.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { clearHighlights, highlightSelection, restoreHighlights } from './inject';

type Store = Record<string, string[]>; // url -> highlighted texts
const COLOR = '#fde047';

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'web-highlighter',
    name: 'Web Highlighter',
    version: '0.1.0',
    description: 'Highlight text on pages; saved per URL and restored on revisit.',
    icon: '🖍️',
    keywords: ['highlight', 'marker', 'annotate', 'note', 'mark', 'research'],
    category: 'Page',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs', 'scripting', 'storage'],
  },

  init(c) {
    ctx = c;
    ctx.tabs.onComplete(async (tabId, url) => {
      const texts = (await load())[url];
      if (texts?.length) {
        try {
          await ctx.tabs.runFunc(tabId, restoreHighlights, [texts, COLOR]);
        } catch {
          /* ignore */
        }
      }
    });
    ctx.log.info('initialized');
  },

  commands: {
    async status() {
      const total = Object.values(await load()).reduce((a, b) => a + b.length, 0);
      return { active: total > 0, summary: total > 0 ? `${total} highlight${total === 1 ? '' : 's'}` : '' };
    },
    async activity() {
      const store = await load();
      return Object.keys(store).map((url) => ({
        id: url,
        label: `${store[url].length} highlight(s) · ${hostOf(url)}`,
        scope: { kind: 'url', pattern: url },
        stoppable: true,
      }));
    },
    async stopActivity(p: { id: string }) {
      await clearUrl(p.id);
      return { ok: true };
    },
    async highlight() {
      const tab = await ctx.tabs.activeTab();
      if (!tab) throw new Error('No active tab');
      const text = await ctx.tabs.runFunc(tab.id, highlightSelection, [COLOR]);
      if (!text) return { added: false };
      const store = await load();
      store[tab.url] = [...(store[tab.url] ?? []), text];
      await ctx.storage.put('store', store);
      return { added: true };
    },
    async clearPage() {
      const tab = await ctx.tabs.activeTab();
      if (!tab) return { ok: true };
      try {
        await ctx.tabs.runFunc(tab.id, clearHighlights, []);
      } catch {
        /* ignore */
      }
      await clearUrl(tab.url);
      return { ok: true };
    },
  },
};

async function clearUrl(url: string): Promise<void> {
  const store = await load();
  delete store[url];
  await ctx.storage.put('store', store);
}

async function load(): Promise<Store> {
  return (await ctx.storage.get<Store>('store')) ?? {};
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default mod;
