// Reader Mode — strip a page down to a clean, readable overlay. Active tabs are tracked
// (and persisted, so they survive worker eviction) and appear in the Activity dashboard
// where they can be turned off (Rule 5).
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { PersistentTabSet } from '../../core/storage/active-set';
import { closeReader, toggleReader } from './inject';

let ctx: ModuleContext;
let active: PersistentTabSet;

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
    capabilities: ['log', 'tabs', 'scripting', 'storage'],
  },

  init(c) {
    ctx = c;
    active = new PersistentTabSet(ctx.storage);
    // A reload removes the overlay; a closed tab is gone — prune either way.
    ctx.tabs.onComplete((tabId) => void active.delete(tabId));
    ctx.tabs.onRemoved((tabId) => void active.delete(tabId));
    ctx.log.info('initialized');
  },

  commands: {
    async toggle() {
      const tab = await ctx.tabs.activeTab();
      if (!tab) throw new Error('No active tab');
      const r = await ctx.tabs.runFunc(tab.id, toggleReader, []);
      if (r === 'on') await active.add(tab.id);
      else await active.delete(tab.id);
      return { state: r ?? 'unknown' };
    },
    async activity() {
      const open = new Set((await ctx.tabs.allTabs()).map((t) => t.id));
      const ids = await active.prune(open);
      return ids.map((tabId) => ({ id: String(tabId), label: 'Reader Mode', scope: { kind: 'tab', tabId }, stoppable: true }));
    },
    async stopActivity(p: { id: string }) {
      const tabId = Number(p.id);
      try {
        await ctx.tabs.runFunc(tabId, closeReader, []);
      } catch {
        /* tab gone — ignore */
      }
      await active.delete(tabId);
      return { ok: true };
    },
  },
};

export default mod;
