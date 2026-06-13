// Selection Toolbar — when enabled, shows Copy/Search/Speak/Highlight above text selections.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { installToolbar } from './inject';

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'selection-toolbar',
    name: 'Selection Toolbar',
    version: '0.1.0',
    description: 'Pop a quick toolbar when you select text.',
    icon: '🧰',
    keywords: ['selection', 'toolbar', 'copy', 'search', 'speak', 'highlight', 'text'],
    category: 'Page',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs', 'scripting', 'storage'],
  },

  init(c) {
    ctx = c;
    ctx.tabs.onComplete(async (tabId) => {
      if (await enabled()) {
        try {
          await ctx.tabs.runFunc(tabId, installToolbar, []);
        } catch {
          /* ignore */
        }
      }
    });
    ctx.log.info('initialized');
  },

  commands: {
    async status() {
      const on = await enabled();
      return { active: on, summary: on ? 'on' : 'off' };
    },
    async toggle() {
      const on = !(await enabled());
      await ctx.storage.put('enabled', on);
      if (on) {
        const tab = await ctx.tabs.activeTab();
        if (tab) {
          try {
            await ctx.tabs.runFunc(tab.id, installToolbar, []);
          } catch {
            /* ignore */
          }
        }
      }
      return { enabled: on };
    },
    async get() {
      return { enabled: await enabled() };
    },
  },
};

async function enabled(): Promise<boolean> {
  return (await ctx.storage.get<boolean>('enabled')) ?? false;
}

export default mod;
