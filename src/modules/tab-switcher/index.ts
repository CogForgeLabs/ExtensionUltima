// Tab Switcher — search all open tabs and jump to one.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'tab-switcher',
    name: 'Tab Switcher',
    version: '0.1.0',
    description: 'Search your open tabs and jump straight to one.',
    icon: '🔀',
    keywords: ['tab', 'switch', 'search tabs', 'jump', 'find tab', 'go to'],
    category: 'Tabs',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs'],
  },

  init(c) {
    ctx = c;
    ctx.log.info('initialized');
  },

  commands: {
    async list() {
      return (await ctx.tabs.allTabs()).map((t) => ({ id: t.id, title: t.title, url: t.url }));
    },
    async activate(p: { id: number }) {
      await ctx.tabs.activate(p.id);
      return { ok: true };
    },
    async close(p: { id: number }) {
      await ctx.tabs.closeTab(p.id);
      return { ok: true };
    },
  },
};

export default mod;
