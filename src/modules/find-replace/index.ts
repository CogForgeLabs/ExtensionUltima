// Find & Replace — highlight or replace text on the current page (literal or regex). Tabs
// with active highlights surface in the Activity dashboard so they can be cleared (Rule 5).
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { clearFind, findHighlight, replaceAll } from './inject';

let ctx: ModuleContext;
const active = new Set<number>();

const mod: ExtensionModule = {
  manifest: {
    id: 'find-replace',
    name: 'Find & Replace',
    version: '0.1.0',
    description: 'Find/highlight or replace text on a page (regex supported).',
    icon: '🔎',
    keywords: ['find', 'replace', 'search', 'regex', 'highlight', 'text'],
    category: 'Page',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs', 'scripting'],
  },
  init(c) {
    ctx = c;
    ctx.tabs.onComplete((tabId) => active.delete(tabId)); // reload clears highlights
    ctx.tabs.onRemoved((tabId) => active.delete(tabId));
    ctx.log.info('initialized');
  },
  commands: {
    async find(p: { query: string; regex: boolean }) {
      const tab = await ctx.tabs.activeTab();
      if (!tab) throw new Error('No active tab');
      const count = (await ctx.tabs.runFunc(tab.id, findHighlight, [p.query, p.regex])) ?? 0;
      if (count > 0) active.add(tab.id);
      else active.delete(tab.id);
      return { count };
    },
    async clear() {
      const tab = await ctx.tabs.activeTab();
      if (tab) {
        await ctx.tabs.runFunc(tab.id, clearFind, []).catch(() => undefined);
        active.delete(tab.id);
      }
      return { ok: true };
    },
    async replace(p: { query: string; repl: string; regex: boolean }) {
      const tab = await ctx.tabs.activeTab();
      if (!tab) throw new Error('No active tab');
      const count = (await ctx.tabs.runFunc(tab.id, replaceAll, [p.query, p.repl, p.regex])) ?? 0;
      return { count };
    },
    activity() {
      return [...active].map((tabId) => ({ id: String(tabId), label: 'Find highlights', scope: { kind: 'tab', tabId }, stoppable: true }));
    },
    async stopActivity(p: { id: string }) {
      const tabId = Number(p.id);
      try {
        await ctx.tabs.runFunc(tabId, clearFind, []);
      } catch {
        /* ignore */
      }
      active.delete(tabId);
      return { ok: true };
    },
  },
};

export default mod;
