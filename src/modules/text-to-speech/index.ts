// Text-to-Speech — read the selected text or whole page aloud.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { speakPage, stopSpeaking } from './inject';

let ctx: ModuleContext;

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
    capabilities: ['log', 'tabs', 'scripting'],
  },

  init(c) {
    ctx = c;
    ctx.log.info('initialized');
  },

  commands: {
    async read(p: { selectionOnly: boolean }) {
      const tab = await ctx.tabs.activeTab();
      if (!tab) throw new Error('No active tab');
      const r = await ctx.tabs.runFunc(tab.id, speakPage, [Boolean(p.selectionOnly)]);
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
      }
      return { ok: true };
    },
  },
};

export default mod;
