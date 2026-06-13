// Find & Replace — highlight or replace text on the current page (literal or regex). Tabs
// with active highlights (persisted) surface in the Activity dashboard so they can be cleared
// (Rule 5).
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { PersistentTabSet } from '../../core/storage/active-set';
import { clearFind, findHighlight, replaceAll } from './inject';

let ctx: ModuleContext;
let active: PersistentTabSet;

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
    capabilities: ['log', 'tabs', 'scripting', 'storage'],
  },
  init(c) {
    ctx = c;
    active = new PersistentTabSet(ctx.storage);
    ctx.tabs.onComplete((tabId) => void active.delete(tabId)); // reload clears highlights
    ctx.tabs.onRemoved((tabId) => void active.delete(tabId));
    ctx.log.info('initialized');
  },
  commands: {
    async find(p: { query: string; regex: boolean }) {
      const tab = await ctx.tabs.activeTab();
      if (!tab) throw new Error('No active tab');
      const count = (await ctx.tabs.runFunc(tab.id, findHighlight, [p.query, p.regex])) ?? 0;
      if (count > 0) await active.add(tab.id);
      else await active.delete(tab.id);
      return { count };
    },
    async clear() {
      const tab = await ctx.tabs.activeTab();
      if (tab) {
        await ctx.tabs.runFunc(tab.id, clearFind, []).catch(() => undefined);
        await active.delete(tab.id);
      }
      return { ok: true };
    },
    async replace(p: { query: string; repl: string; regex: boolean }) {
      const tab = await ctx.tabs.activeTab();
      if (!tab) throw new Error('No active tab');
      const count = (await ctx.tabs.runFunc(tab.id, replaceAll, [p.query, p.repl, p.regex])) ?? 0;
      return { count };
    },
    async activity() {
      const open = new Set((await ctx.tabs.allTabs()).map((t) => t.id));
      const ids = await active.prune(open);
      return ids.map((tabId) => ({ id: String(tabId), label: 'Find highlights', scope: { kind: 'tab', tabId }, stoppable: true }));
    },
    async stopActivity(p: { id: string }) {
      const tabId = Number(p.id);
      try {
        await ctx.tabs.runFunc(tabId, clearFind, []);
      } catch {
        /* ignore */
      }
      await active.delete(tabId);
      return { ok: true };
    },
  },
};

export default mod;
