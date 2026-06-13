// Incognito Opener — open the current page (or a URL) in a private window.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'incognito-opener',
    name: 'Incognito Opener',
    version: '0.1.0',
    description: 'Open the current page in a private window.',
    icon: '🕶️',
    keywords: ['incognito', 'private', 'window', 'open', 'inprivate'],
    category: 'Privacy',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs'],
  },
  init(c) {
    ctx = c;
    ctx.log.info('initialized');
  },
  commands: {
    async openCurrent() {
      const tab = await ctx.tabs.activeTab();
      if (!tab || !/^https?:/.test(tab.url)) throw new Error('No page to open.');
      await ctx.tabs.openIncognito(tab.url);
      return { ok: true };
    },
  },
};

export default mod;
