// Text Expander — type a trigger (e.g. ;sig) and it expands to saved text. Snippets are
// stored encrypted and injected into pages.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { installExpander } from './inject';

type Snippets = Record<string, string>;

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'text-expander',
    name: 'Text Expander',
    version: '0.1.0',
    description: 'Expand short triggers into saved snippets as you type.',
    icon: '⌨️',
    keywords: ['text expander', 'snippet', 'macro', 'abbreviation', 'autotext', 'template'],
    category: 'Page',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs', 'scripting', 'storage'],
  },

  init(c) {
    ctx = c;
    ctx.tabs.onComplete(async (tabId) => {
      const s = await load();
      if (Object.keys(s).length) {
        try {
          await ctx.tabs.runFunc(tabId, installExpander, [s]);
        } catch {
          /* ignore */
        }
      }
    });
    ctx.log.info('initialized');
  },

  commands: {
    async list() {
      return await load();
    },
    async add(p: { trigger: string; text: string }) {
      if (!p.trigger || !p.text) throw new Error('Trigger and text required.');
      const s = await load();
      s[p.trigger] = p.text;
      await ctx.storage.put('snippets', s);
      await reinject(s);
      return { ok: true };
    },
    async remove(p: { trigger: string }) {
      const s = await load();
      delete s[p.trigger];
      await ctx.storage.put('snippets', s);
      await reinject(s);
      return { ok: true };
    },
    async status() {
      const n = Object.keys(await load()).length;
      return { active: n > 0, summary: n ? `${n} snippet(s)` : '' };
    },
  },
};

async function reinject(s: Snippets): Promise<void> {
  const tab = await ctx.tabs.activeTab();
  if (tab) {
    try {
      await ctx.tabs.runFunc(tab.id, installExpander, [s]);
    } catch {
      /* ignore */
    }
  }
}

async function load(): Promise<Snippets> {
  return (await ctx.storage.get<Snippets>('snippets')) ?? {};
}

export default mod;
