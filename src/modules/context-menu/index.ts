// Context-Menu Actions — adds right-click actions (page-local). The background creates the
// menu items from `items()` and routes clicks to `onClick` (see background/index.ts).
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { cleanUrlNow, highlightCurrent, speakText } from './inject';

interface Item {
  id: string;
  title: string;
  contexts: string[];
}

const ITEMS: Item[] = [
  { id: 'speak', title: 'Read selection aloud', contexts: ['selection'] },
  { id: 'search', title: 'Search for "%s"', contexts: ['selection'] },
  { id: 'highlight', title: 'Highlight selection', contexts: ['selection'] },
  { id: 'cleanurl', title: 'Clean this URL', contexts: ['page'] },
];

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'context-menu',
    name: 'Context Menu',
    version: '0.1.0',
    description: 'Right-click actions: read aloud, search, highlight, clean URL.',
    icon: '🖲️',
    keywords: ['context menu', 'right click', 'menu', 'actions', 'selection'],
    category: 'Power',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs', 'scripting', 'storage'],
    extraPermissions: ['contextMenus'],
  },
  init(c) {
    ctx = c;
    ctx.log.info('initialized');
  },
  commands: {
    async items() {
      const s = await load();
      return ITEMS.filter((i) => s.includes(i.id));
    },
    async all() {
      const s = await load();
      return ITEMS.map((i) => ({ ...i, enabled: s.includes(i.id) }));
    },
    async toggle(p: { id: string }) {
      let s = await load();
      s = s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id];
      await ctx.storage.put('enabled', s);
      return { ok: true };
    },
    async status() {
      const s = await load();
      return { active: s.length > 0, summary: `${s.length} action(s)` };
    },
    async onClick(p: { menuItemId: string; selectionText?: string; tabId?: number }) {
      if (p.tabId == null) return { ok: false };
      const id = p.menuItemId;
      if (id === 'speak') await ctx.tabs.runFunc(p.tabId, speakText, [p.selectionText ?? '']);
      else if (id === 'highlight') await ctx.tabs.runFunc(p.tabId, highlightCurrent, []);
      else if (id === 'cleanurl') await ctx.tabs.runFunc(p.tabId, cleanUrlNow, []);
      else if (id === 'search' && p.selectionText) await ctx.tabs.openUrl('https://www.google.com/search?q=' + encodeURIComponent(p.selectionText), { active: true });
      return { ok: true };
    },
  },
};

async function load(): Promise<string[]> {
  return (await ctx.storage.get<string[]>('enabled')) ?? ['speak', 'search', 'highlight', 'cleanurl'];
}

export default mod;
