// Auto-Scroll — hands-free scrolling of the active tab. Active tabs surface in the Activity
// dashboard so scrolling can be stopped from there (Rule 5).
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { startScroll, stopScroll } from './inject';

let ctx: ModuleContext;
const active = new Set<number>();

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
    capabilities: ['log', 'tabs', 'scripting'],
  },

  init(c) {
    ctx = c;
    ctx.tabs.onComplete((tabId) => active.delete(tabId)); // reload stops the interval
    ctx.tabs.onRemoved((tabId) => active.delete(tabId));
    ctx.log.info('initialized');
  },

  commands: {
    async start(p: { speed: number }) {
      const tab = await ctx.tabs.activeTab();
      if (!tab) throw new Error('No active tab');
      await ctx.tabs.runFunc(tab.id, startScroll, [Math.max(1, p.speed || 1)]);
      active.add(tab.id);
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
        active.delete(tab.id);
      }
      return { ok: true };
    },
    activity() {
      return [...active].map((tabId) => ({ id: String(tabId), label: 'Auto-Scroll', scope: { kind: 'tab', tabId }, stoppable: true }));
    },
    async stopActivity(p: { id: string }) {
      const tabId = Number(p.id);
      try {
        await ctx.tabs.runFunc(tabId, stopScroll, []);
      } catch {
        /* ignore */
      }
      active.delete(tabId);
      return { ok: true };
    },
  },
};

export default mod;
