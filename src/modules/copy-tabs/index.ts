// Copy / Open Tab URLs — export the current window's tab URLs, or open a pasted list.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'copy-tabs',
    name: 'Copy Tab URLs',
    version: '0.1.0',
    description: 'Copy all open tab URLs, or open a list of URLs.',
    icon: '🔗',
    keywords: ['copy', 'tabs', 'urls', 'export', 'open list', 'links'],
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
    async urls() {
      return (await ctx.tabs.currentWindowTabs()).map((t) => t.url).filter((u) => /^https?:/.test(u));
    },
    async open(p: { urls: string[] }) {
      for (const u of p.urls.filter((x) => /^https?:\/\//.test(x))) await ctx.tabs.openUrl(u, { active: false });
      return { ok: true };
    },
  },
};

export default mod;
