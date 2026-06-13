// Reader Mode — strip a page down to a clean, readable overlay. Active tabs are tracked so
// they appear in the Activity dashboard and can be turned off from there (Rule 5).
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { closeReader, toggleReader } from './inject';

let ctx: ModuleContext;
const active = new Set<number>();

const mod: ExtensionModule = {
  manifest: {
    id: 'reader-mode',
    name: 'Reader Mode',
    version: '0.1.0',
    description: 'Declutter a page into a clean reading view.',
    icon: '📖',
    keywords: ['reader', 'read', 'declutter', 'article', 'clean', 'distraction free'],
    category: 'Page',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs', 'scripting'],
  },

  init(c) {
    ctx = c;
    // A reload removes the overlay; a closed tab is gone — prune either way.
    ctx.tabs.onComplete((tabId) => active.delete(tabId));
    ctx.tabs.onRemoved((tabId) => active.delete(tabId));
    ctx.log.info('initialized');
  },

  commands: {
    async toggle() {
      const tab = await ctx.tabs.activeTab();
      if (!tab) throw new Error('No active tab');
      const r = await ctx.tabs.runFunc(tab.id, toggleReader, []);
      if (r === 'on') active.add(tab.id);
      else active.delete(tab.id);
      return { state: r ?? 'unknown' };
    },
    activity() {
      return [...active].map((tabId) => ({ id: String(tabId), label: 'Reader Mode', scope: { kind: 'tab', tabId }, stoppable: true }));
    },
    async stopActivity(p: { id: string }) {
      const tabId = Number(p.id);
      try {
        await ctx.tabs.runFunc(tabId, closeReader, []);
      } catch {
        /* tab gone — ignore */
      }
      active.delete(tabId);
      return { ok: true };
    },
  },
};

export default mod;
