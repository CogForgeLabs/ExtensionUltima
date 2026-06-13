// Auto-Scroll — hands-free scrolling of the active tab. Active tabs (persisted) surface in
// the Activity dashboard so scrolling can be stopped from there (Rule 5).
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { PersistentTabSet } from '../../core/storage/active-set';
import { startScroll, stopScroll } from './inject';

let ctx: ModuleContext;
let active: PersistentTabSet;

const mod: ExtensionModule = {
  manifest: {
    id: 'auto-scroll',
    name: 'Auto-Scroll',
    version: '0.1.0',
    description: 'Scroll the page automatically, hands-free.',
    icon: '📜',
    keywords: ['scroll', 'auto scroll', 'reading', 'hands free', 'teleprompter'],
    category: 'Page',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs', 'scripting', 'storage'],
  },

  init(c) {
    ctx = c;
    active = new PersistentTabSet(ctx.storage);
    ctx.tabs.onComplete((tabId) => void active.delete(tabId)); // reload stops the interval
    ctx.tabs.onRemoved((tabId) => void active.delete(tabId));
    ctx.log.info('initialized');
  },

  commands: {
    async start(p: { speed: number }) {
      const tab = await ctx.tabs.activeTab();
      if (!tab) throw new Error('No active tab');
      await ctx.tabs.runFunc(tab.id, startScroll, [Math.max(1, p.speed || 1)]);
      await active.add(tab.id);
      return { ok: true };
    },
    async stop() {
      const tab = await ctx.tabs.activeTab();
      if (tab) {
        try {
          await ctx.tabs.runFunc(tab.id, stopScroll, []);
        } catch {
          /* ignore */
        }
        await active.delete(tab.id);
      }
      return { ok: true };
    },
    async activity() {
      const open = new Set((await ctx.tabs.allTabs()).map((t) => t.id));
      const ids = await active.prune(open);
      return ids.map((tabId) => ({ id: String(tabId), label: 'Auto-Scroll', scope: { kind: 'tab', tabId }, stoppable: true }));
    },
    async stopActivity(p: { id: string }) {
      const tabId = Number(p.id);
      try {
        await ctx.tabs.runFunc(tabId, stopScroll, []);
      } catch {
        /* ignore */
      }
      await active.delete(tabId);
      return { ok: true };
    },
  },
};

export default mod;
