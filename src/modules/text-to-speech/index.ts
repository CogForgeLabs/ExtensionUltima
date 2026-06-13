// Text-to-Speech — read the selected text or whole page aloud. Tabs currently being read
// (persisted) surface in the Activity dashboard so reading can be stopped from there (Rule 5).
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { PersistentTabSet } from '../../core/storage/active-set';
import { speakPage, stopSpeaking } from './inject';

let ctx: ModuleContext;
let active: PersistentTabSet;

const mod: ExtensionModule = {
  manifest: {
    id: 'text-to-speech',
    name: 'Read Aloud',
    version: '0.1.0',
    description: 'Read the selection or the whole page aloud.',
    icon: '🔊',
    keywords: ['speech', 'tts', 'read aloud', 'voice', 'accessibility', 'speak'],
    category: 'Utilities',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs', 'scripting', 'storage'],
  },

  init(c) {
    ctx = c;
    active = new PersistentTabSet(ctx.storage);
    ctx.tabs.onComplete((tabId) => void active.delete(tabId)); // reload stops speech
    ctx.tabs.onRemoved((tabId) => void active.delete(tabId));
    ctx.log.info('initialized');
  },

  commands: {
    async read(p: { selectionOnly: boolean }) {
      const tab = await ctx.tabs.activeTab();
      if (!tab) throw new Error('No active tab');
      const r = await ctx.tabs.runFunc(tab.id, speakPage, [Boolean(p.selectionOnly)]);
      if (r === 'speaking') await active.add(tab.id);
      return { state: r ?? 'unknown' };
    },
    async stop() {
      const tab = await ctx.tabs.activeTab();
      if (tab) {
        try {
          await ctx.tabs.runFunc(tab.id, stopSpeaking, []);
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
      return ids.map((tabId) => ({ id: String(tabId), label: 'Read Aloud', scope: { kind: 'tab', tabId }, stoppable: true }));
    },
    async stopActivity(p: { id: string }) {
      const tabId = Number(p.id);
      try {
        await ctx.tabs.runFunc(tabId, stopSpeaking, []);
      } catch {
        /* ignore */
      }
      await active.delete(tabId);
      return { ok: true };
    },
  },
};

export default mod;
