// Merge Windows — pull every tab from all windows into the current one.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'merge-windows',
    name: 'Merge Windows',
    version: '0.1.0',
    description: 'Combine all browser windows into one.',
    icon: '🪟',
    keywords: ['merge', 'windows', 'combine', 'consolidate', 'tabs'],
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
    async merge() {
      await ctx.tabs.mergeAllIntoCurrent();
      return { ok: true };
    },
  },
};

export default mod;
