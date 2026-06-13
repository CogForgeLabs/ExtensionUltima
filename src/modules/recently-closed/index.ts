// Recently Closed — list and reopen recently closed tabs.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'recently-closed',
    name: 'Recently Closed',
    version: '0.1.0',
    description: 'Reopen tabs you just closed.',
    icon: '↩️',
    keywords: ['recently closed', 'reopen', 'restore', 'undo close', 'tab'],
    category: 'Tabs',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs'],
    extraPermissions: ['sessions'],
  },
  init(c) {
    ctx = c;
    ctx.log.info('initialized');
  },
  commands: {
    async list() {
      return ctx.tabs.recentlyClosed();
    },
    async restore(p: { sessionId: string }) {
      await ctx.tabs.restoreClosed(p.sessionId);
      return { ok: true };
    },
  },
};

export default mod;
