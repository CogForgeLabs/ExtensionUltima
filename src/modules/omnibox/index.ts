// Omnibox — type the "eu" keyword in the address bar for a quick search/open. The background
// wires onInputChanged/onInputEntered to suggest() / run() (see background/index.ts).
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'omnibox',
    name: 'Address-bar Commands',
    version: '0.1.0',
    description: 'Type "eu" then space in the address bar to search or open a URL.',
    icon: '⌨️',
    keywords: ['omnibox', 'address bar', 'search', 'keyword', 'launch', 'command'],
    category: 'Power',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs'],
  },
  init(c) {
    ctx = c;
    ctx.log.info('initialized');
  },
  commands: {
    suggest(p: { text: string }) {
      const t = p.text.trim();
      if (!t) return [];
      return [
        { content: `search:${t}`, description: `Search the web for "${t}"` },
        { content: `open:${t}`, description: `Open ${t} as a URL` },
      ];
    },
    async run(p: { text: string }) {
      let t = p.text.trim();
      let open = false;
      if (t.startsWith('open:')) {
        open = true;
        t = t.slice(5).trim();
      } else if (t.startsWith('search:')) {
        t = t.slice(7).trim();
      }
      const looksUrl = /^https?:\/\//.test(t) || /^[\w-]+(\.[\w-]+)+(\/|$)/.test(t);
      if (open || looksUrl) {
        await ctx.tabs.openUrl(/^https?:\/\//.test(t) ? t : `https://${t}`, { active: true });
      } else {
        await ctx.tabs.openUrl('https://www.google.com/search?q=' + encodeURIComponent(t), { active: true });
      }
      return { ok: true };
    },
  },
};

export default mod;
